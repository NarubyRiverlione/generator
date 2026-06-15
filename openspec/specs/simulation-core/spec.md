# Spec: Simulation Core

## Purpose

The simulation core is the pure physics engine of the islanded synchronous generator simulator. It performs all computation in per-unit, models a constant-power load, solves steady-state machine equations, applies first-order exciter field lag, and provides an optional AVR PI controller. It has no UI dependencies and exposes no real-unit constants inside the solver.

## Requirements

### Requirement: Per-unit base and fixed machine parameters
The simulation core SHALL perform all internal computation in per-unit, using a single central base (S_base = 1 MVA, V_LL_base = 400 V, f_rated = 50 Hz) and fixed machine parameters (Xₛ = 1.2 pu, Rₐ = 0.05 pu). Conversion to real display units (V, kW, kVAR, A) SHALL occur only at readout time, never inside the solver.

#### Scenario: Internal math stays in per-unit
- **WHEN** the core solves the circuit for any input set
- **THEN** every intermediate quantity (Eₐ, Vₜ, Iₐ, P, Q) is expressed in per-unit and no real-unit constant appears in the solver

#### Scenario: Display conversion applied once at the edge
- **WHEN** an output value is presented to the UI layer
- **THEN** the per-unit value is multiplied by its base exactly once (e.g. Vₜ_pu × 400 V, P_pu × 1000 kW)

### Requirement: Constant-power load model
The core SHALL model the load as constant power. The active-load slider (0–100 % of rated) and the power-factor slider SHALL define the load's active power P and reactive power Q directly, independent of terminal voltage. Lagging power factor SHALL produce Q > 0 (inductive) and leading power factor SHALL produce Q < 0 (capacitive).

#### Scenario: Load demand derived from sliders
- **WHEN** active load is 50 % and power factor is 0.85 lagging
- **THEN** the load demand is P = 0.5 pu and Q = 0.5·tan(acos(0.85)) pu with Q positive

#### Scenario: Leading power factor yields negative Q
- **WHEN** the power factor is set to a leading value
- **THEN** the resulting load Q is negative

### Requirement: Steady-state circuit solve
Given the internal EMF Eₐ and the load demand (P, Q), the core SHALL solve the round-rotor machine equations for terminal voltage Vₜ and load angle δ by solving the quadratic in Vₜ² and selecting the upper (physically stable) root, then derive armature current Iₐ, active power, reactive power, and calculated power factor consistently from that solution.

#### Scenario: No-load terminal voltage equals EMF
- **WHEN** active load is 0 %
- **THEN** terminal voltage Vₜ settles to Eₐ and armature current Iₐ is approximately zero

#### Scenario: Load increase sags terminal voltage with fixed field
- **WHEN** active load increases while the exciter field is held constant (AVR off)
- **THEN** the solved terminal voltage Vₜ is lower than before the load increase

#### Scenario: Load angle increases with load
- **WHEN** active load increases monotonically with fixed field
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
