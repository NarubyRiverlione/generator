## ADDED Requirements

### Requirement: Voltage stability margin display
The UI SHALL display the voltage stability margin (VSM) reported by the core as a percentage on the
status display. It SHALL be shown amber when below 20 % and red when below 8 %, giving an advance
warning of approaching voltage collapse.

#### Scenario: VSM percentage shown
- **WHEN** the simulation is running
- **THEN** the status display shows the current VSM as a percentage

#### Scenario: VSM colour escalates near collapse
- **WHEN** the VSM falls below 20 % and then below 8 %
- **THEN** the VSM readout turns amber, then red

### Requirement: ANSI-27 under-voltage relay
The UI driver SHALL implement an ANSI-27 under-voltage relay that disconnects the load when terminal
voltage falls below 0.85 pu. The relay SHALL arm only once Vₜ has risen above the trip threshold
(startup inhibit), so it does not fire during field build-up from cold. On trip it SHALL set active
load to 0, surface a trip banner and a red LED indicator, and latch until the user resets it via a
dome reset control. After reset the relay SHALL re-arm only once Vₜ is again healthy, preventing an
immediate re-trip.

#### Scenario: Relay trips on under-voltage and sheds load
- **WHEN** terminal voltage falls below 0.85 pu after having been healthy
- **THEN** the relay trips, active load is set to 0, and the trip banner and red LED are shown

#### Scenario: No spurious trip during cold start
- **WHEN** the machine starts from zero field and Vₜ rises through 0.85 pu during field build-up
- **THEN** the relay does not trip (it arms only after Vₜ exceeds the threshold)

#### Scenario: Reset re-arms without immediate re-trip
- **WHEN** the user clicks the dome reset after a trip
- **THEN** the banner clears, the load control is free again, and the relay re-arms only once Vₜ is healthy

### Requirement: Field-at-ceiling indicator
The UI SHALL show a field-at-ceiling indicator (amber) when AVR is enabled and the AVR field command
has reached its maximum (≥ ceiling), signalling that the regulator can no longer raise excitation to
hold voltage.

#### Scenario: Indicator lights when AVR saturates
- **WHEN** AVR is enabled and its field command reaches the ceiling
- **THEN** the field-at-ceiling indicator lights amber

## REMOVED Requirements

### Requirement: Load-angle stability warning
**Reason:** At realistic power factors (e.g. 0.85 lag with Xₛ = 1.2) the machine collapses at
δ ≈ 26–29°, so a δ→90° threshold never fires before collapse. The warning is superseded by the
discriminant-based VSM readout and the ANSI-27 under-voltage relay, which trip before the physics
collapse point is reached.
**Migration:** The "Warning near the stability limit" and "Collapsed state surfaced" scenarios are
replaced by the VSM display (amber/red thresholds) and the ANSI-27 relay trip banner/LED. The core
still freezes physics on collapse per the simulation-core "Voltage-collapse handling" requirement,
but this state is no longer reached in normal operation because the relay sheds load first.
