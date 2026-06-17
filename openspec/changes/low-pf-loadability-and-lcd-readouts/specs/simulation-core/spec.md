## ADDED Requirements

### Requirement: Saturation-derate and load-droop signals are exported for readout
The simulation core SHALL expose two derived diagnostic signals in `Outputs` so the UI can make the
saturation and governor-droop physics legible:

- `saturationFactor` — the open-circuit derate ratio `saturation(iField) / iField` (dimensionless),
  clamped to `1.0` when `iField ≤ 0`. A value of 1.0 means the field is below the saturation knee
  (no derate); values below 1.0 quantify how much above-knee saturation is eroding EMF gain.
- `droopRpm` — the load-induced speed drop at the current operating point, `Pe · govDroop · RPM_RATED`
  (rpm), where `Pe` is the active power output. This is the RPM the active load is pulling below the
  kinematic (valve-only) speed target.

Both values SHALL be computed each step from the same quantities the solver already uses and returned
alongside the existing outputs.

#### Scenario: Saturation factor is 1.0 below the knee
- **WHEN** the lagged field current is at or below 1.0 pu
- **THEN** `Outputs.saturationFactor` equals 1.0

#### Scenario: Saturation factor falls above the knee
- **WHEN** the lagged field current is above the saturation knee (e.g. at the command ceiling 1.7 pu)
- **THEN** `Outputs.saturationFactor` is less than 1.0 and equals `saturation(iField) / iField`

#### Scenario: Droop RPM tracks active load
- **WHEN** active power output is `Pe`
- **THEN** `Outputs.droopRpm` equals `Pe · govDroop · RPM_RATED`, and is 0 at no load
