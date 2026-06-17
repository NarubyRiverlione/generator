## MODIFIED Requirements

### Requirement: Generator output readouts
The UI SHALL display terminal voltage (Vₜ) and active power (P) as SVG arc gauges and numeric values,
and SHALL display reactive power (Q), load angle (δ), calculated power factor, shaft speed in **RPM**
(headline), output frequency in **Hz**, and the **valve position** as a twin-needle dial. Q SHALL be
labelled "supplying" when positive and "absorbing" when negative.

The valve position SHALL be shown on the `PositionIndicator` component as two distinct needles:
- **Setpoint needle**: driven by `valvePct` from `Outputs` (the governor demand position)
- **Actual needle**: driven by `valveActual` from `Outputs` (the physical valve position, lagged)

No placeholder values SHALL be used for either needle. Both props SHALL be sourced from the live
simulation `Outputs` object each render cycle.

#### Scenario: Gauges and numerics update as the simulation settles
- **WHEN** the simulation state changes and settles
- **THEN** the Vₜ and P gauges and all numeric readouts — including RPM and Hz — update continuously to reflect the current solved values

#### Scenario: Reactive power direction labelled
- **WHEN** the solved Q is negative (leading/capacitive load)
- **THEN** the Q readout is labelled "absorbing"; when Q is positive it is labelled "supplying"

#### Scenario: RPM and frequency reflect the physical valve position
- **WHEN** the speed-changer is held lower until the valve and speed settle
- **THEN** the RPM and Hz readouts fall together following `valveActual`, not `valvePct`

#### Scenario: Valve position indicator shows both needles from live outputs
- **WHEN** the simulation is running and the speed-changer is held
- **THEN** the `PositionIndicator` setpoint needle moves immediately with `valvePct` and the actual needle lags behind, driven by `valveActual`, with no placeholder values

#### Scenario: Valve position indicator needles converge after switch release
- **WHEN** the speed-changer is released and sufficient time passes (~2 s)
- **THEN** the actual needle on `PositionIndicator` catches up to the setpoint needle and both align
