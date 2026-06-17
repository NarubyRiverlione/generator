## ADDED Requirements

### Requirement: Governor droop parameter
`Params` SHALL include a `govDroop` field (dimensionless, per-unit load per per-unit speed) representing the steady-state speed drop per unit of active electrical load when the valve is held fixed. A value of `0.04` represents 4 % droop (60 rpm at full load, rated valve).

#### Scenario: govDroop present in Params
- **WHEN** the simulation is initialised
- **THEN** `PARAMS.govDroop` is a finite positive number

## MODIFIED Requirements

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
