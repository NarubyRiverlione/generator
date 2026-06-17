## MODIFIED Requirements

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
