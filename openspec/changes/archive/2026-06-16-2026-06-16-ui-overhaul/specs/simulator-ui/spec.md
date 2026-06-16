## MODIFIED Requirements

### Requirement: Input panel controls
The UI SHALL present rotary **knobs** with numeric value labels for exciter field DC (0–1.5 pu,
default 0), active load (0–100 %, default 0), and power factor (0.6 lag through 1.0 to 0.6 lead,
default 0.85 lag), plus an AVR on/off selector switch (default off). The rotor speed / frequency
SHALL be fixed at 50 Hz and SHALL NOT be exposed as a control.

#### Scenario: Knobs show current value
- **WHEN** the user turns any input knob
- **THEN** the knob's numeric label updates to the current value in its unit

#### Scenario: No rotor-speed control in MVP
- **WHEN** the input panel is rendered
- **THEN** there is no rotor-speed or frequency knob and no frequency readout

### Requirement: AVR control behavior
AVR SHALL be toggled by an on/off selector switch. The AVR voltage reference SHALL be fixed at rated
(1.0 pu / 400 V) and SHALL NOT be user-adjustable. When AVR is enabled, the UI SHALL make the exciter
field DC knob read-only and display the value the AVR is currently commanding; when AVR is disabled,
the field DC knob SHALL be user-adjustable.

#### Scenario: Field knob becomes read-only under AVR
- **WHEN** the user enables AVR via the selector switch
- **THEN** the exciter field DC knob becomes read-only and shows the AVR-commanded value

#### Scenario: Field knob restored when AVR disabled
- **WHEN** the user disables AVR
- **THEN** the exciter field DC knob becomes user-adjustable again

#### Scenario: Voltage reference is fixed
- **WHEN** AVR is enabled
- **THEN** the AVR regulates terminal voltage to the fixed rated reference and no Vref control is shown

### Requirement: Responsive layout
The UI SHALL present the controls and readouts as a switchboard-style grid that follows the physical
signal chain (exciter input → exciter chain → generator output), and SHALL remain usable on narrow
viewports.

#### Scenario: Layout remains usable on narrow viewports
- **WHEN** the viewport is narrow (mobile width)
- **THEN** the grid reflows and all knobs, switches, and readouts remain usable
