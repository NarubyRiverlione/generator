# Spec: Simulation Core

## Purpose

The simulation core is the pure physics engine of the islanded synchronous generator simulator. It performs all computation in per-unit, models a constant-power load, solves steady-state machine equations, applies first-order exciter field lag, and provides an optional AVR PI controller. It has no UI dependencies and exposes no real-unit constants inside the solver.
## Requirements
### Requirement: Per-unit base and fixed machine parameters
The simulation core SHALL perform all internal computation in per-unit, using a single central base
(S_base = 1 MVA, V_LL_base = 400 V, f_rated = 50 Hz) and fixed machine parameters (Xₛ = 1.2 pu,
Rₐ = 0.05 pu). Conversion to real display units (V, kW, kVAR, A, Hz, RPM) SHALL occur only at readout
time, never inside the solver. Rotor speed SHALL be treated as a variable (default ~0.9967 pu at
initial valve ~93.1 %), driven by the turbine governor; it is no longer a fixed constant.

#### Scenario: Internal math stays in per-unit
- **WHEN** the core solves the circuit for any input set
- **THEN** every intermediate quantity (Eₐ, Vₜ, Iₐ, P, Q, speed_pu) is expressed in per-unit and no real-unit constant appears in the solver

#### Scenario: Display conversion applied once at the edge
- **WHEN** an output value is presented to the UI layer
- **THEN** the per-unit value is multiplied by its base exactly once (e.g. Vₜ_pu × 400 V, P_pu × 1000 kW, rpm derived as valvePct × VALVE_RPM_MAX / 100, frequencyHz derived as rpm / 30)

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

### Requirement: Governor droop parameter
`Params` SHALL include a `govDroop` field (dimensionless, per-unit load per per-unit speed) representing the steady-state speed drop per unit of active electrical load when the valve is held fixed. A value of `0.04` represents 4 % droop (60 rpm at full load, rated valve).

#### Scenario: govDroop present in Params
- **WHEN** the simulation is initialised
- **THEN** `PARAMS.govDroop` is a finite positive number

### Requirement: RPM, frequency, and valve-position outputs
The simulation core SHALL derive RPM, frequency, and valve positions from the lagged speed state and
return them in `Outputs`. The derivation direction SHALL be valve-first, shaft-primary, using the
physical valve position (`valveActual`) to compute the kinematic speed target, then subtracting the
load-induced droop offset before applying the spin-up lag:

```
speedTarget_pu  = (valveActual / 100) × VALVE_RPM_MAX / RPM_RATED   // kinematic target
effectiveTarget = speedTarget_pu − Pe_prev × govDroop                // droop-corrected
speedLagged    ← first-order lag toward effectiveTarget (τ_spinup)   // same form as before
rpm             = speedLagged × RPM_RATED
frequencyHz     = rpm / 30
```

`Pe_prev` is the active power output from the previous simulation step (`state.lastValidOutputs.p`).
At no load (`Pe_prev = 0`) the behavior is identical to the kinematic-only model.

Both `rpm` and `frequencyHz` SHALL be computed each step from the lagged rotor speed. `Outputs` SHALL
include both `valvePct` (setpoint) and `valveActual` (physical position). All four values SHALL be
returned alongside Vₜ, P, Q, δ and the other existing outputs.

#### Scenario: RPM and Hz track lagged speed
- **WHEN** rotor speed has settled at a given physical valve position with zero load
- **THEN** `rpm` equals `speedLagged × 1500` and `frequencyHz` equals `rpm / 30`, consistent with each other

#### Scenario: Rated readouts at rated physical valve position with zero load
- **WHEN** `valveActual` has settled at ~93.75 % with zero active load
- **THEN** `frequencyHz` is 50 Hz and `rpm` is 1500

#### Scenario: Load reduces RPM at fixed valve
- **WHEN** active load increases while the valve is held at the rated position
- **THEN** the settled RPM is lower than 1500 by approximately `Pe × govDroop × RPM_RATED`

#### Scenario: Valve raise restores RPM after load increase
- **WHEN** the operator raises the valve to compensate for added load
- **THEN** RPM recovers toward the pre-load value

#### Scenario: Zero physical valve targets zero RPM
- **WHEN** `valveActual` is held at 0 % long enough for the spin-up lag to settle
- **THEN** `rpm` approaches 0 and `frequencyHz` approaches 0

#### Scenario: Setpoint ahead of actual during jogging
- **WHEN** the valve setpoint is being raised but the actuator lag has not settled
- **THEN** `valvePct` is greater than `valveActual` in `Outputs`, and RPM/Hz follow `valveActual`

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

