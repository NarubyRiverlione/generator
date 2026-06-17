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
The core SHALL apply a first-order time lag with time constant τ = 1.5 s to the exciter field signal, so that when the field target changes the field current moves toward the new target exponentially rather than instantly. The lag SHALL be advanced by the real elapsed time per step.

#### Scenario: Field step settles over the time constant
- **WHEN** the field target is stepped up and the simulation advances by one time constant (~1.5 s)
- **THEN** the field current has moved approximately 63 % of the way toward the new target

#### Scenario: Field step essentially complete after several time constants
- **WHEN** the simulation advances by roughly four time constants after a field step
- **THEN** the field current is essentially at the new target

### Requirement: AVR PI regulation
The core SHALL provide an optional AVR implemented as a PI controller (Kp = 2.0, Ki = 0.5) acting on the terminal-voltage error (Vref − Vₜ) and commanding the field setpoint. The commanded setpoint SHALL be clamped to [0.5, 1.5] pu and the integrator SHALL include anti-windup so the integral cannot accumulate while the command is clamped. The AVR command SHALL still pass through the physical field lag.

#### Scenario: AVR holds terminal voltage under load
- **WHEN** active load increases with AVR enabled
- **THEN** the field command rises automatically and the settled terminal voltage stays within tolerance of the AVR reference voltage

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

### Requirement: RPM, frequency, and valve-position outputs
The simulation core SHALL derive RPM, frequency, and valve position from the lagged speed state and
return them in `Outputs`. The derivation direction SHALL be valve-first, shaft-primary:

```
rpmTarget   = (valvePct / 100) × VALVE_RPM_MAX    // valve drives RPM target
speedLagged ← first-order lag toward (rpmTarget / RPM_RATED)   // spin-up lag
rpm         = speedLagged × RPM_RATED              // actual RPM from lagged speed
frequencyHz = rpm / 30                             // Hz derived last — shaft knows RPM, not Hz
```

Both `rpm` and `frequencyHz` SHALL be computed each step from the lagged rotor speed and returned
alongside Vₜ, P, Q, δ and the other existing outputs.

#### Scenario: RPM and Hz track lagged speed
- **WHEN** rotor speed has settled at a given valve position
- **THEN** `rpm` equals `speedLagged × 1500` and `frequencyHz` equals `rpm / 30`, consistent with each other

#### Scenario: Rated readouts at rated speed
- **WHEN** rotor speed is 1.0 pu (valve at ~93.75 %)
- **THEN** `frequencyHz` is 50 Hz and `rpm` is 1500, regardless of field or load settings

#### Scenario: Zero valve targets zero RPM
- **WHEN** valve position is held at 0 % long enough for the spin-up lag to settle
- **THEN** `rpm` approaches 0 and `frequencyHz` approaches 0

