## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Governor droop parameter
**Reason**: The swing equation makes rotor speed emerge from the mechanical/electrical power balance, so
the kinematic droop offset (`Pe × govDroop`) is gone. Stage 3b adds an isochronous governor (no droop),
and droop / load-sharing returns only in Phase 4. The `govDroop` parameter is therefore removed.
**Migration**: Remove `govDroop` from `Params`/`PARAMS`. Code that read `govDroop` to compute a speed
offset now reads `omega` directly from the swing equation. The `droopRpm` output is likewise removed
(see "Saturation-derate and power-balance signals"); UI that displayed it shows the power imbalance
`Pm − Pe` instead.
