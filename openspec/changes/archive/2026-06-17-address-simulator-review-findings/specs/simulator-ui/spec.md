## MODIFIED Requirements

### Requirement: Input panel controls
The UI SHALL present rotary **knobs** with numeric value labels for exciter field DC (`0.0-1.5 pu`,
default `0.0`), active load (`0-100 %`, default `0`), and power factor (`0.6 lag` through `1.0` to
`0.6 lead`, default `0.85 lag`), an AVR on/off selector switch (default off), and a turbine governor
**speed-changer**: a spring-return raise/lower switch (neutral centre, two-stage slow/fast throw)
that drives the intake valve. The rotor speed is controlled via the valve position; the machine starts
with the valve pre-set at ~93 % (giving ~1495 rpm).

The spring-loaded speed-changer SHALL return to neutral on mouse/touch release and touch-cancel events.

#### Scenario: Knobs show current value
- **WHEN** the user turns any input knob
- **THEN** the knob's numeric label updates to the current value in its unit

#### Scenario: Governor speed-changer present
- **WHEN** the input panel is rendered
- **THEN** a spring-return raise/lower speed-changer switch is present, and holding it raises or lowers the intake valve (and thereby rotor speed)

#### Scenario: Touch-cancel returns selector to neutral
- **WHEN** an active touch gesture on the speed-changer is cancelled by the platform
- **THEN** the control returns to neutral and command output becomes neutral immediately

### Requirement: Generator output readouts
The UI SHALL display terminal voltage (Vₜ) and active power (P) as SVG arc gauges and numeric values,
and SHALL display reactive power (Q), load angle (δ), calculated power factor, shaft speed in **RPM**
(headline), output frequency in **Hz**, and the **valve position** (%) as numeric values. Q SHALL be
labelled "supplying" when positive and "absorbing" when negative.

The operator legend/readout text for rated valve position SHALL state rated near `~93.75 %`, consistent
with the governor mapping.

#### Scenario: Gauges and numerics update as the simulation settles
- **WHEN** the simulation state changes and settles
- **THEN** the Vₜ and P gauges and all numeric readouts — including RPM, Hz, and valve position — update continuously to reflect the current solved values

#### Scenario: Reactive power direction labelled
- **WHEN** the solved Q is negative (leading/capacitive load)
- **THEN** the Q readout is labelled "absorbing"; when Q is positive it is labelled "supplying"

#### Scenario: RPM and frequency reflect the valve
- **WHEN** the speed-changer is held lower until the valve and speed settle
- **THEN** the RPM and Hz readouts fall together and the valve-position readout shows the reduced opening

### Requirement: ANSI-27 under-voltage relay
The UI driver SHALL implement an ANSI-27 under-voltage relay that disconnects the load when terminal
voltage falls below `0.85 pu`. The relay SHALL arm only once `Vt` has risen above the trip threshold
(startup inhibit), so it does not fire during field build-up from cold. On trip it SHALL set active
load to `0`, surface a trip banner and a red LED indicator, and latch until the user resets it via a
dome reset control.

While latched, effective simulation input SHALL keep load disconnected (`loadFraction = 0`) even if the
operator manipulates the load control. After reset the relay SHALL re-arm only once `Vt` is again
healthy, preventing an immediate re-trip.

#### Scenario: Relay trips on under-voltage and sheds load
- **WHEN** terminal voltage falls below `0.85 pu` after having been healthy
- **THEN** the relay trips, active load is set to `0`, and the trip banner and red LED are shown

#### Scenario: No spurious trip during cold start
- **WHEN** the machine starts from zero field and `Vt` rises through `0.85 pu` during field build-up
- **THEN** the relay does not trip (it arms only after `Vt` exceeds the threshold)

#### Scenario: Tripped relay clamps effective load input
- **WHEN** relay-27 is tripped and the operator increases the load control
- **THEN** effective simulation load remains `0` until reset clears the latch

#### Scenario: Reset re-arms without immediate re-trip
- **WHEN** the user clicks the dome reset after a trip
- **THEN** the banner clears, the load control is free again, and the relay re-arms only once `Vt` is healthy
