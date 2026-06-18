# Spec: Simulation Core

## Purpose

The simulation core is the pure physics engine of the islanded synchronous generator simulator. It performs all computation in per-unit, models a constant-power load, solves steady-state machine equations, applies first-order exciter field lag, provides an optional AVR PI controller, and integrates rotor speed from the undamped swing equation. It has no UI dependencies and exposes no real-unit constants inside the solver.
## Requirements
### Requirement: Swing-equation rotor dynamics
The simulation core SHALL evolve rotor speed `ω` (per-unit, 1.0 = `RPM_RATED`) by integrating the
undamped swing equation each step, rather than gliding a kinematic speed target through a lag:

```
dω/dt = (Pm − Pe) / (2H)
ω ← ω + (dω/dt)·dt        // forward Euler, dt = real elapsed time
```

where `Pm` is mechanical power in (from the valve, see "Valve commands mechanical power"), `Pe` is the
active electrical power output, and `H` is the inertia constant (s). The equation SHALL NOT include a
damping term `D·(ω − 1)`: such a term is a restoring force toward rated speed and would make the islanded
machine self-regulate to a steady frequency without operator action — the self-regulation this stage
deliberately omits (it belongs to the 3b governor and the 3c grid). `ω` SHALL be a genuinely integrated
state field on `SimState` (named `omega`); it is no longer derived from the valve position by a lag.
`RPM_RATED` and the readout derivations (`rpm = omega · RPM_RATED`, `frequencyHz = rpm / 30`) are
unchanged.

`Pe` SHALL be taken from the previous step's active power output (`state.lastValidOutputs.p`), so the
integration does not depend circularly on the current solve. The one-step delay is negligible at
simulation cadence, and additional `Pe` terms (e.g. a synchronising-power term in a later stage) can be
added to this same expression.

`ω` SHALL be floored at 0 (the rotor cannot spin backwards) and bounded at the existing overspeed
ceiling: when `ω` reaches `VALVE_RPM_MAX / RPM_RATED` (~1.067), the core SHALL clamp `ω` at that ceiling
rather than integrating without limit, consistent with the established overspeed concept.

Because the islanded constant-power load makes `Pe` independent of `ω`, the equation is a **pure
integrator**: there is **no restoring force** and **no equilibrium the rotor can reach on its own**, so
a load step makes frequency **drift monotonically** until the operator acts. Damped oscillation and
self-settling are out of scope for this stage.

#### Scenario: Surplus mechanical power accelerates the rotor from rest
- **WHEN** `omega` is 0, the load is disconnected (`Pe = 0`), and the valve commands a positive `Pm`
- **THEN** `omega` increases over time (the rotor runs up), and `rpm` rises toward the speed where the net imbalance is zero

#### Scenario: Fixed valve has no reachable stable frequency after a load step
- **WHEN** active load is increased so `Pe > Pm` and the valve is then held fixed
- **THEN** `omega` (and hence `rpm`/`frequencyHz`) drifts downward monotonically and does not settle at a new steady frequency within the operating band — the operator must raise the valve to rebalance

#### Scenario: Raising the valve rebalances power and arrests the drift
- **WHEN** the operator raises the valve after a load step until `Pm ≈ Pe`
- **THEN** `dω/dt` approaches 0 and `frequencyHz` stops drifting, settling near its current value

#### Scenario: Frequency drifts linearly, not oscillating, under a power imbalance
- **WHEN** a constant power imbalance `Pm − Pe` is held with the valve fixed
- **THEN** `omega` changes at an approximately constant rate `(Pm − Pe)/(2H)` with no overshoot or ringing

#### Scenario: Overspeed ceiling clamps a runaway rotor
- **WHEN** surplus `Pm` would drive `omega` above `VALVE_RPM_MAX / RPM_RATED`
- **THEN** `omega` is clamped at that ceiling and `rpm` does not exceed `VALVE_RPM_MAX`

#### Scenario: Collapse rejects the load in the swing equation
- **WHEN** the machine solve is collapsed (terminal voltage near zero, no power transfer)
- **THEN** the `Pe` used in the swing equation is 0 (load rejection) rather than a frozen non-zero value, so the rotor accelerates rather than integrating against a phantom load

### Requirement: Valve commands mechanical power
The physical valve position (`valveActual`, produced by the existing valve actuator lag) SHALL command
mechanical power into the rotor, not a speed target. The mapping SHALL be linear:

```
Pm = (valveActual / 100) · PM_MAX
```

`PM_MAX` SHALL be a fixed constant anchored so that `Pm` is approximately 1.0 pu at the rated valve
position (~93.75 %), giving a small power headroom at 100 % valve that mirrors the existing overspeed
margin. `Pm` SHALL be treated as power directly and SHALL NOT depend on `ω`. `Pm` SHALL be exposed in
`Outputs` as `pm` so the UI can show the mechanical-vs-electrical power balance.

#### Scenario: Rated valve commands rated mechanical power
- **WHEN** `valveActual` is at the rated position (~93.75 %)
- **THEN** `Outputs.pm` is approximately 1.0 pu

#### Scenario: Closed valve commands zero mechanical power
- **WHEN** `valveActual` is 0 %
- **THEN** `Outputs.pm` is 0

#### Scenario: Mechanical power is independent of speed
- **WHEN** `ω` changes while `valveActual` is held fixed
- **THEN** `Outputs.pm` is unchanged

### Requirement: Inertia parameter
The simulation core SHALL expose an inertia constant `H` (seconds of rated kinetic energy) as a machine
parameter. `H` SHALL be a finite positive number. The swing equation in this stage SHALL be undamped:
the core SHALL NOT introduce a damping coefficient `D` or any other restoring force toward rated speed,
so that a fixed valve has no equilibrium speed within the operating band (self-regulation is deferred to
the 3b governor and the 3c grid).

#### Scenario: Inertia parameter present and no damping term
- **WHEN** the simulation is initialised
- **THEN** the inertia constant `H` is a finite positive number, and the swing equation contains no damping / restoring-force term

### Requirement: Per-unit base and fixed machine parameters
The simulation core SHALL perform all internal computation in per-unit, using a single central base
(S_base = 1 MVA, V_LL_base = 400 V, f_rated = 50 Hz) and fixed machine parameters (Xₛ = 0.8 pu,
Rₐ = 0.05 pu). Conversion to real display units (V, kW, kVAR, A, Hz, RPM) SHALL occur only at readout
time, never inside the solver. Rotor speed SHALL be treated as a variable, integrated from the swing
equation (power imbalance over inertia); it is no longer a fixed constant nor a kinematic function of
the valve position.

#### Scenario: Internal math stays in per-unit
- **WHEN** the core solves the circuit for any input set
- **THEN** every intermediate quantity (Eₐ, Vₜ, Iₐ, P, Q, ω) is expressed in per-unit and no real-unit constant appears in the solver

#### Scenario: Display conversion applied once at the edge
- **WHEN** an output value is presented to the UI layer
- **THEN** the per-unit value is multiplied by its base exactly once (e.g. Vₜ_pu × 400 V, P_pu × 1000 kW, rpm derived as omega × RPM_RATED, frequencyHz derived as rpm / 30)

### Requirement: Constant-power load model
The core SHALL model the load as constant power. The active-load slider (0–100 % of rated) and the power-factor slider SHALL define the load's active power P and reactive power Q directly, independent of terminal voltage. Lagging power factor SHALL produce Q > 0 (inductive) and leading power factor SHALL produce Q < 0 (capacitive).

#### Scenario: Load demand derived from sliders
- **WHEN** active load is 50 % and power factor is 0.85 lagging
- **THEN** the load demand is P = 0.5 pu and Q = 0.5·tan(acos(0.85)) pu with Q positive

#### Scenario: Leading power factor yields negative Q
- **WHEN** the power factor is set to a leading value
- **THEN** the resulting load Q is negative

### Requirement: Steady-state circuit solve
The core SHALL solve the round-rotor machine equations for terminal voltage Vₜ and load angle δ from
the internal EMF Eₐ (which equals `field_pu × speed_pu`) and the load demand (P, Q), by solving the
quadratic in Vₜ² and selecting the upper (physically stable) root, then derive armature current Iₐ,
active power, reactive power, and calculated power factor consistently from that solution.

#### Scenario: No-load terminal voltage equals EMF
- **WHEN** active load is 0 % with a non-zero field and rated speed
- **THEN** terminal voltage Vₜ settles to Eₐ (= field_pu × speed_pu) and armature current Iₐ is approximately zero

#### Scenario: Load increase sags terminal voltage with fixed field and speed
- **WHEN** active load increases while exciter field and rotor speed are both held constant (AVR off)
- **THEN** the solved terminal voltage Vₜ is lower than before the load increase

#### Scenario: Speed reduction sags terminal voltage with fixed field
- **WHEN** rotor speed is reduced below 1.0 pu while the exciter field is held constant (AVR off)
- **THEN** the solved terminal voltage Vₜ decreases because Eₐ = field_pu × speed_pu is lower

#### Scenario: Load angle increases with load
- **WHEN** active load increases monotonically with fixed field and speed
- **THEN** the solved load angle δ increases monotonically

### Requirement: Voltage-collapse handling
When the load demand exceeds maximum loadability (the quadratic in Vₜ² has no real root), the core SHALL NOT produce NaN or undefined output. It SHALL freeze the last valid operating point and expose an explicit collapsed/unstable state flag so the UI can present it.

#### Scenario: Past the PV nose the solver does not emit NaN
- **WHEN** the load demand is pushed beyond maximum loadability
- **THEN** the core reports a collapsed state and retains the last valid output values, with no NaN in any field

#### Scenario: Recovery from collapse
- **WHEN** the load is reduced back below maximum loadability after a collapse
- **THEN** the core clears the collapsed flag and resumes solving normally

### Requirement: First-order exciter field lag
The core SHALL model the exciter field response as two stacked first-order lags with a combined DC
gain of unity: an exciter lag (τ_exciter = 0.4 s) feeding a main-field-winding lag (τ_field = 1.1 s),
so the field current follows a field-target step with an S-shaped, second-order response rather than a
single exponential. Each lag SHALL be advanced by the real elapsed time per step using the same
exact-exponential form as the existing single lag.

#### Scenario: Field step has a second-order response
- **WHEN** the field target is stepped up
- **THEN** the field current rises with an S-shaped response (initially slow, then faster) rather than a pure single-exponential, and settles at the new target

#### Scenario: Net settling time preserved
- **WHEN** the field target is stepped and the simulation advances several seconds
- **THEN** the field current settles to the new target with an overall time scale comparable to the previous single 1.5 s lag

### Requirement: AVR PI regulation
The core SHALL provide an optional AVR implemented as a PI controller acting on the terminal-voltage
error (Vref − Vₜ) and commanding the field setpoint, with Kp and Ki supplied as adjustable inputs
(defaults Kp = 2.0, Ki = 0.5; ranges Kp [0.5, 5.0], Ki [0.1, 2.0]). The commanded setpoint SHALL be
clamped to [0.5, 1.5] pu and the integrator SHALL include anti-windup so the integral cannot accumulate
while the command is clamped. The AVR command SHALL still pass through the physical field lag.

#### Scenario: AVR holds terminal voltage under load
- **WHEN** active load increases with AVR enabled
- **THEN** the field command rises automatically and the settled terminal voltage stays within tolerance of the AVR reference voltage

#### Scenario: High proportional gain overshoots
- **WHEN** Kp is set high and a field step is applied with AVR enabled
- **THEN** the terminal voltage overshoots its reference (peak Vₜ > Vref) before settling, because the field plant is now second-order

#### Scenario: Default gains remain stable
- **WHEN** Kp and Ki are at their defaults
- **THEN** the AVR step response settles without sustained oscillation

#### Scenario: Command stays within limits
- **WHEN** the AVR runs under any input combination, including sustained large error
- **THEN** the commanded field setpoint never leaves the range [0.5, 1.5] and the integrator remains bounded

### Requirement: Isochronous governor PI regulation
The core SHALL provide an optional isochronous governor implemented as a PI controller acting on the
speed error `(ωref − ω)` and commanding the valve setpoint (`valvePct`, %) directly. The governor
SHALL be implemented in a dedicated `governor.ts` file mirroring the structure of `avr.ts`, with a
function `stepGovernor(omegaRef, omega, integralIn, kp, ki, dt) → { command, integral }`.

The governor SHALL be gated by `inputs.governorOn` (default `false`). The PI integral and command
SHALL carry the same anti-windup logic as the AVR: freeze the integral when the command is clamped and
the unsaturated-raw error would deepen the saturation. The command SHALL be clamped to `[0, 100]`
(valve percent). Fixed gains `GOV_KP` and `GOV_KI` and the reference constant `OMEGA_REF = 1.0` SHALL
be defined in `constants.ts`.

When `governorOn` is `true`:
- The governor drives `valvePct` for this step; the valve jog from `inputs.valveCommand` is bypassed.
- Bumpless transfer on engage: the integrator SHALL be primed so the governor output equals the current
  `valvePct` at the moment of engagement:
  `integral = (current_valvePct − GOV_KP × error) / GOV_KI`.

When `governorOn` is `false`, `valvePct` evolves from the manual jog path as before.

`governorIntegral` SHALL be carried in `SimState`. `governorCommand` (the clamped valve % commanded by
the governor, equal to `inputs.valveCommand`-derived `valvePct` when governor is off) SHALL be exposed
in `Outputs`.

#### Scenario: Governor holds frequency under load increase
- **WHEN** active load increases with the governor enabled
- **THEN** `valvePct` rises automatically, `Pm` tracks `Pe`, and `frequencyHz` returns to 50 Hz

#### Scenario: Governor is off — manual jog works unchanged
- **WHEN** `governorOn` is `false`
- **THEN** `valvePct` evolves from the speed-changer jog input exactly as in Stage 3a

#### Scenario: Bumpless transfer on governor engage
- **WHEN** the governor is switched on while the machine is running with a non-zero valve position
- **THEN** `valvePct` does not jump on the first governor step — the first commanded value equals the current valve position

#### Scenario: Governor command clamped at valve ceiling
- **WHEN** speed error is large enough to demand more than 100 % valve opening
- **THEN** `governorCommand` is clamped at 100 and the integrator is frozen (anti-windup)

#### Scenario: Manual jog bypassed when governor is on
- **WHEN** `governorOn` is `true` and `inputs.valveCommand` is non-zero
- **THEN** the governor's PI output drives `valvePct`; the jog input has no effect

#### Scenario: Default gains provide stable response
- **WHEN** `GOV_KP` and `GOV_KI` are at their defaults and a step load increase is applied
- **THEN** `frequencyHz` recovers to 50 Hz without sustained oscillation

### Requirement: Voltage stability margin
The machine solver SHALL compute a voltage stability margin (VSM) from the discriminant of the
Vₜ² quadratic and expose it as `stabilityMargin` in `Outputs`, normalised to [0, 1] where 1.0 is
no-load (fully stable) and 0.0 is the PV-nose point (about to collapse). VSM SHALL be defined as
`max(0, D) / D_no_load`, where `D` is the current discriminant and `D_no_load = (9·Eₐ²/Xₛ²)²` is the
discriminant at zero load. It SHALL be computed before the collapse early-return (so a margin is
always reported for a valid operating point) and SHALL be independent of power-factor angle and load
angle. When Eₐ = 0 (and `D_no_load` is therefore 0) the margin SHALL be reported as 0 rather than
dividing by zero.

#### Scenario: Margin is 1.0 at no load
- **WHEN** active load is 0 % with a non-zero field
- **THEN** `stabilityMargin` is 1.0

#### Scenario: Margin falls toward zero approaching collapse
- **WHEN** load increases toward maximum loadability
- **THEN** `stabilityMargin` decreases monotonically toward 0 and reaches ~0 at the nose point

#### Scenario: Margin independent of power factor
- **WHEN** the same active load is applied at different power factors
- **THEN** the reported margin reflects the discriminant only and is not derived from the load angle δ

### Requirement: RPM, frequency, and valve-position outputs
The simulation core SHALL derive RPM, frequency, and valve positions from the integrated rotor speed
`omega` and return them in `Outputs`. The derivation SHALL read directly from the swing-equation state
rather than from a droop-corrected kinematic lag:

```
omega        ← swing-equation integration (see "Swing-equation rotor dynamics")
rpm          = omega × RPM_RATED
frequencyHz  = rpm / 30
```

Both `rpm` and `frequencyHz` SHALL be computed each step from `omega`. `Outputs` SHALL include both
`valvePct` (setpoint) and `valveActual` (physical position). All values SHALL be returned alongside
Vₜ, P, Q, δ and the other existing outputs.

#### Scenario: RPM and Hz track the integrated speed
- **WHEN** rotor speed has settled at a value where `Pm ≈ Pe`
- **THEN** `rpm` equals `omega × 1500` and `frequencyHz` equals `rpm / 30`, consistent with each other

#### Scenario: Rated readouts when mechanical and electrical power balance at rated speed
- **WHEN** the operator has trimmed the valve so the rotor holds `omega = 1.0` with the current load
- **THEN** `frequencyHz` is 50 Hz and `rpm` is 1500

#### Scenario: Load step drives RPM down at fixed valve
- **WHEN** active load is increased so `Pe > Pm` while the valve is held fixed
- **THEN** `rpm` drifts below 1500 and continues falling until the operator raises the valve (it does not settle at a droop offset)

#### Scenario: Valve raise restores RPM after load increase
- **WHEN** the operator raises the valve to make `Pm ≈ Pe` after a load increase
- **THEN** the RPM drift halts and recovers toward 1500

#### Scenario: Zero physical valve runs the rotor down under load
- **WHEN** `valveActual` is held at 0 % (`Pm = 0`) with the rotor spinning and active load present (`Pe > 0`)
- **THEN** `rpm` decreases toward 0 and `frequencyHz` decreases toward 0 as the load decelerates the rotor

#### Scenario: Setpoint ahead of actual during jogging
- **WHEN** the valve setpoint is being raised but the actuator lag has not settled
- **THEN** `valvePct` is greater than `valveActual` in `Outputs`, and `Pm` follows `valveActual`

### Requirement: Numerical safety at degenerate operating points
The simulation core SHALL return finite outputs for any finite input set, including startup and
near-singular states where `Ea` and/or `Vt` approach zero. Division-sensitive calculations (including
`delta` and `ia`) SHALL use guarded forms so the solver never emits `NaN` or `Infinity`.

At zero excitation and zero load, the core SHALL treat the operating point as a valid finite rest
state (`collapsed = false`) with `Vt = 0`, `Ia = 0`, and `delta = 0`.

#### Scenario: Zero-excitation rest state remains finite
- **WHEN** field excitation is zero and load demand is zero
- **THEN** the solver returns `Vt = 0`, `Ia = 0`, `delta = 0`, and `collapsed = false` with no non-finite values

#### Scenario: Near-singular loaded state does not emit non-finite values
- **WHEN** excitation and terminal voltage are near zero while load demand is non-zero
- **THEN** the solver reports a valid finite state (typically collapsed/frozen) with no `NaN` or `Infinity` in outputs

### Requirement: Load-demand input sanitization
The simulation core SHALL sanitize load-demand inputs before trigonometric evaluation so invalid caller
inputs cannot corrupt solver state:

- `loadFraction` SHALL be treated as `max(0, value)` for finite values; non-finite values SHALL be treated as `0`
- `powerFactor` magnitude SHALL be clamped to `[0, 1]`; non-finite values SHALL default to `1`
- The lag/lead sign SHALL continue to be determined only by `pfLag`

#### Scenario: Out-of-range power factor is bounded safely
- **WHEN** `powerFactor` is outside `[0, 1]`
- **THEN** demand computation uses the nearest bound and produces finite `P` and `Q`

#### Scenario: Non-finite load input collapses to zero demand
- **WHEN** `loadFraction` is `NaN` or non-finite
- **THEN** demand computation treats active load as `0` and returns finite `P` and `Q`

### Requirement: Lagged field signal is exported for downstream readouts
The simulation core SHALL expose the lagged field signal used in the solver as `Outputs.iField`, and
this value SHALL equal the simulation state's lagged field after each step.

#### Scenario: Exported lagged field tracks field dynamics
- **WHEN** field target changes and the simulation advances in time
- **THEN** `Outputs.iField` follows the configured field lag and converges to the same steady-state as the internal lagged field state

#### Scenario: AVR command and lagged field can diverge transiently
- **WHEN** AVR command changes faster than the field time constant
- **THEN** `Outputs.iField` is distinct from `avrCommand` during transient response and converges afterward

### Requirement: Saturation-derate and power-balance signals are exported for readout
The simulation core SHALL expose diagnostic signals in `Outputs` so the UI can make the saturation and
rotor-dynamics physics legible:

- `saturationFactor` — the open-circuit derate ratio `saturation(iField) / iField` (dimensionless),
  clamped to `1.0` when `iField ≤ 0`. A value of 1.0 means the field is below the saturation knee
  (no derate); values below 1.0 quantify how much above-knee saturation is eroding EMF gain.
- `pm` — mechanical power in (per-unit), from the valve mapping. Together with the existing active-power
  output `p` (= `Pe`), this lets the UI present the power imbalance `Pm − Pe` that the swing equation
  integrates. The previous `droopRpm` signal is removed (no droop model remains in this stage).

Both `saturationFactor` and `pm` SHALL be computed each step from the same quantities the solver already
uses and returned alongside the existing outputs.

#### Scenario: Saturation factor is 1.0 below the knee
- **WHEN** the lagged field current is at or below 1.0 pu
- **THEN** `Outputs.saturationFactor` equals 1.0

#### Scenario: Saturation factor falls above the knee
- **WHEN** the lagged field current is above the saturation knee (e.g. at the command ceiling 1.7 pu)
- **THEN** `Outputs.saturationFactor` is less than 1.0 and equals `saturation(iField) / iField`

#### Scenario: Mechanical power exported for the power balance
- **WHEN** the valve commands a mechanical power `Pm`
- **THEN** `Outputs.pm` equals that `Pm`, and `Outputs.pm − Outputs.p` is the power imbalance the rotor integrates

### Requirement: Seeded initial state
The core SHALL provide `initialState(inputs?: Inputs, seed?: Partial<SimState>)`, which takes each lagged
state field from `seed` where present and otherwise derives it from `inputs` (defaulting to
`DEFAULT_INPUTS`). It SHALL compute `lastValidOutputs` from the resulting laggeds the same way `step()`
does, so the returned state is internally coherent with the seed on the very first frame. When called
with no arguments (or an empty seed), the returned state SHALL be identical to the prior no-argument
behaviour. The seed only changes *where* the simulation starts; it SHALL NOT alter how `step()` evolves
the state.

#### Scenario: No seed reproduces the default start
- **WHEN** `initialState()` is called with no arguments
- **THEN** the returned state equals the default start (zero field, valve ≈ 93 %, near-synchronous `omega`) field-for-field

#### Scenario: Seed overrides only named fields and stays coherent
- **WHEN** `initialState(inputs, { iField: 1.0, omega: 1.0 })` is called
- **THEN** `iField` and `omega` take the seeded values, the remaining laggeds derive from `inputs`, and `lastValidOutputs` is solved from the seeded laggeds (no cold-frame mismatch)

#### Scenario: Seeded state evolves under the unchanged step
- **WHEN** a seeded settled state is advanced by `step()`
- **THEN** the physics evolve exactly as they would for the same state reached by settling — no behaviour of `step()` depends on whether the state came from a seed

