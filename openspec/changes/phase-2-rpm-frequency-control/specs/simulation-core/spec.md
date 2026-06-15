## MODIFIED Requirements

### Requirement: Per-unit base and fixed machine parameters
The simulation core SHALL perform all internal computation in per-unit, using a single central base (S_base = 1 MVA, V_LL_base = 400 V, f_rated = 50 Hz) and fixed machine parameters (Xₛ = 1.2 pu, Rₐ = 0.05 pu). Conversion to real display units (V, kW, kVAR, A, Hz) SHALL occur only at readout time, never inside the solver. Rotor speed SHALL be treated as a variable input (default 1.0 pu); it is no longer a fixed constant.

#### Scenario: Internal math stays in per-unit
- **WHEN** the core solves the circuit for any input set
- **THEN** every intermediate quantity (Eₐ, Vₜ, Iₐ, P, Q, speed_pu) is expressed in per-unit and no real-unit constant appears in the solver

#### Scenario: Display conversion applied once at the edge
- **WHEN** an output value is presented to the UI layer
- **THEN** the per-unit value is multiplied by its base exactly once (e.g. Vₜ_pu × 400 V, P_pu × 1000 kW, speed_pu × 50 Hz)

### Requirement: Steady-state circuit solve
Given the internal EMF Eₐ (which now equals field_pu × speed_pu) and the load demand (P, Q), the core SHALL solve the round-rotor machine equations for terminal voltage Vₜ and load angle δ by solving the quadratic in Vₜ² and selecting the upper (physically stable) root, then derive armature current Iₐ, active power, reactive power, and calculated power factor consistently from that solution.

#### Scenario: No-load terminal voltage equals EMF
- **WHEN** active load is 0 %
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

## ADDED Requirements

### Requirement: Frequency output
The simulation core SHALL include output frequency in `SimulatorOutputs` as `frequencyHz`, derived as `frequencyHz = 50 × speed_pu` where speed_pu is the lagged per-unit rotor speed. This value SHALL be computed each step and returned alongside Vₜ, P, Q, δ, and the other existing outputs.

#### Scenario: Frequency tracks lagged speed
- **WHEN** rotor speed is set to 47 Hz and sufficient time passes for the lag to settle
- **THEN** frequencyHz in outputs is 47 Hz (± 0.05 Hz)

#### Scenario: Frequency is 50 Hz at rated speed
- **WHEN** rotor speed is 50 Hz
- **THEN** frequencyHz in outputs is 50 Hz regardless of field or load settings
