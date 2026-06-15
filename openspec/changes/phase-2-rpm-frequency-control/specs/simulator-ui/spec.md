## MODIFIED Requirements

### Requirement: Input panel controls
The UI SHALL present sliders with numeric value labels for exciter field DC (0.5–1.5 pu, default 1.0), active load (0–100 %, default 50), power factor (0.6 lag through 1.0 to 0.6 lead, default 0.85 lag), turbine governor (47–53 Hz, default 50 Hz, step 0.1 Hz), and an AVR on/off toggle (default off).

#### Scenario: Sliders show current value
- **WHEN** the user drags any input slider
- **THEN** the adjacent numeric label updates to the current value in its unit

#### Scenario: Turbine governor slider present
- **WHEN** the input panel is rendered
- **THEN** a turbine governor slider is present with range 47–53 Hz and its current value displayed in Hz

#### Scenario: Governor at 50 Hz matches Phase 1 baseline
- **WHEN** the turbine governor slider is at 50 Hz
- **THEN** simulation output is identical to Phase 1 behaviour for the same field and load settings

### Requirement: Generator output readouts
The UI SHALL display terminal voltage (Vₜ) and active power (P) as SVG arc gauges and numeric values, and SHALL display reactive power (Q), load angle (δ), calculated power factor, and output frequency (Hz) as numeric values. Q SHALL be labelled "supplying" when positive and "absorbing" when negative.

#### Scenario: Gauges and numerics update as the simulation settles
- **WHEN** the simulation state changes and settles
- **THEN** the Vₜ and P gauges, all numeric readouts, and the frequency readout update continuously to reflect the current solved values

#### Scenario: Reactive power direction labelled
- **WHEN** the solved Q is negative (leading/capacitive load)
- **THEN** the Q readout is labelled "absorbing"; when Q is positive it is labelled "supplying"

#### Scenario: Frequency readout reflects governor setting
- **WHEN** the turbine governor is set to 47 Hz and the speed lag has settled
- **THEN** the frequency readout displays 47.0 Hz

## REMOVED Requirements

### Requirement: No rotor-speed control in MVP
**Reason:** Phase 2 adds the turbine governor slider; the MVP restriction no longer applies.
**Migration:** The scenario "No rotor-speed or frequency slider is present" is replaced by the new "Turbine governor slider present" scenario in the modified Input panel controls requirement above.
