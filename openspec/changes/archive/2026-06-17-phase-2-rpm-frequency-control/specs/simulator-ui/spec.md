## MODIFIED Requirements

### Requirement: Input panel controls
The UI SHALL present rotary knobs with numeric value labels for exciter field DC (0–1.5 pu, default 0),
active load (0–100 %, default 0), and power factor (0.6 lag through 1.0 to 0.6 lead, default 0.85 lag),
an AVR on/off selector switch (default off), and a turbine governor **speed-changer**: a spring-return
raise/lower switch (neutral centre, two-stage slow/fast throw) that drives the intake valve. The rotor
speed is no longer fixed — it is controlled via the valve position, which the speed-changer switch trims.
The machine starts with the valve already at the operating position (~93 %, giving ~1495 rpm).

#### Scenario: Knobs show current value
- **WHEN** the user turns any input knob
- **THEN** the knob's numeric label updates to the current value in its unit

#### Scenario: Governor speed-changer present
- **WHEN** the input panel is rendered
- **THEN** a spring-return raise/lower speed-changer switch is present, and holding it raises or lowers the intake valve (and thereby rotor speed)

#### Scenario: Governor at rated valve matches rated speed
- **WHEN** the valve is at ~93.75 % (rated position)
- **THEN** simulation output shows 1500 rpm / 50 Hz

### Requirement: Generator output readouts
The UI SHALL display terminal voltage (Vₜ) and active power (P) as SVG arc gauges and numeric values,
and SHALL display reactive power (Q), load angle (δ), calculated power factor, shaft speed in **RPM**
(headline), output frequency in **Hz**, and the **valve position** (%) as numeric values. Q SHALL be
labelled "supplying" when positive and "absorbing" when negative.

#### Scenario: Gauges and numerics update as the simulation settles
- **WHEN** the simulation state changes and settles
- **THEN** the Vₜ and P gauges and all numeric readouts — including RPM, Hz, and valve position — update continuously to reflect the current solved values

#### Scenario: Reactive power direction labelled
- **WHEN** the solved Q is negative (leading/capacitive load)
- **THEN** the Q readout is labelled "absorbing"; when Q is positive it is labelled "supplying"

#### Scenario: RPM and frequency reflect the valve
- **WHEN** the speed-changer is held lower until the valve and speed settle
- **THEN** the RPM and Hz readouts fall together and the valve-position readout shows the reduced opening
