## MODIFIED Requirements

### Requirement: Per-unit base and fixed machine parameters
The simulation core SHALL perform all internal computation in per-unit, using a single central base
(S_base = 1 MVA, V_LL_base = 400 V, f_rated = 50 Hz) and fixed machine parameters (Xₛ = 1.2 pu,
Rₐ = 0.05 pu). Conversion to real display units (V, kW, kVAR, A, Hz, RPM) SHALL occur only at readout
time, never inside the solver. Rotor speed SHALL be treated as a variable (default 1.0 pu), driven by
the turbine governor; it is no longer a fixed constant.

#### Scenario: Internal math stays in per-unit
- **WHEN** the core solves the circuit for any input set
- **THEN** every intermediate quantity (Eₐ, Vₜ, Iₐ, P, Q, speed_pu) is expressed in per-unit and no real-unit constant appears in the solver

#### Scenario: Display conversion applied once at the edge
- **WHEN** an output value is presented to the UI layer
- **THEN** the per-unit value is multiplied by its base exactly once (e.g. Vₜ_pu × 400 V, P_pu × 1000 kW, speed_pu × 50 Hz → Hz, then × 30 → RPM)

### Requirement: Steady-state circuit solve
The core SHALL solve the round-rotor machine equations for terminal voltage Vₜ and load angle δ from
the internal EMF Eₐ (which now equals `field_pu × speed_pu`) and the load demand (P, Q), by solving the
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

## ADDED Requirements

### Requirement: Frequency and RPM outputs
The simulation core SHALL include output frequency and shaft speed in `Outputs`: `frequencyHz` derived
as `50 × speed_pu`, and `rpm` derived as `(120 / poles) × frequencyHz` for the fixed pole count
(4 poles → `rpm = 30 × frequencyHz`, so 1500 rpm at 50 Hz). Both SHALL be computed each step from the
lagged rotor speed and returned alongside Vₜ, P, Q, δ and the other existing outputs.

#### Scenario: Frequency and RPM track lagged speed
- **WHEN** rotor speed corresponds to 47 Hz and the spin-up lag has settled
- **THEN** `frequencyHz` ≈ 47 Hz and `rpm` ≈ 1410 (± tolerance)

#### Scenario: Rated readouts at rated speed
- **WHEN** rotor speed is 1.0 pu (nominal valve)
- **THEN** `frequencyHz` is 50 Hz and `rpm` is 1500, regardless of field or load settings
