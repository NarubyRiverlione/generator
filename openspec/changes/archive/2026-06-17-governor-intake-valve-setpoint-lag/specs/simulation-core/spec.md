## MODIFIED Requirements

### Requirement: RPM, frequency, and valve-position outputs
The simulation core SHALL derive RPM, frequency, and valve positions from the lagged speed state and
return them in `Outputs`. The derivation direction SHALL be valve-first, shaft-primary, using the
physical valve position (`valveActual`) — not the setpoint (`valvePct`) — to drive the RPM target:

```
rpmTarget   = (valveActual / 100) × VALVE_RPM_MAX   // physical valve drives RPM target
speedLagged ← first-order lag toward (rpmTarget / RPM_RATED)  // spin-up lag
rpm         = speedLagged × RPM_RATED               // actual RPM from lagged speed
frequencyHz = rpm / 30                              // Hz derived last — shaft knows RPM, not Hz
```

Both `rpm` and `frequencyHz` SHALL be computed each step from the lagged rotor speed. `Outputs` SHALL
include both `valvePct` (setpoint, the integrated governor demand) and `valveActual` (physical position,
the actuator-lagged state). All four values SHALL be returned alongside Vₜ, P, Q, δ and the other
existing outputs.

#### Scenario: RPM and Hz track lagged speed
- **WHEN** rotor speed has settled at a given physical valve position
- **THEN** `rpm` equals `speedLagged × 1500` and `frequencyHz` equals `rpm / 30`, consistent with each other

#### Scenario: Rated readouts at rated physical valve position
- **WHEN** `valveActual` has settled at ~93.75 % (rated position)
- **THEN** `frequencyHz` is 50 Hz and `rpm` is 1500, regardless of field or load settings

#### Scenario: Zero physical valve targets zero RPM
- **WHEN** `valveActual` is held at 0 % long enough for the spin-up lag to settle
- **THEN** `rpm` approaches 0 and `frequencyHz` approaches 0

#### Scenario: Setpoint ahead of actual during jogging
- **WHEN** the valve setpoint is being raised but the actuator lag has not settled
- **THEN** `valvePct` is greater than `valveActual` in `Outputs`, and RPM/Hz follow `valveActual`
