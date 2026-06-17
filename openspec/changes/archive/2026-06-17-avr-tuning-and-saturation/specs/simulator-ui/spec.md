## MODIFIED Requirements

### Requirement: AVR control behavior
AVR SHALL be toggled by an on/off selector switch. The AVR voltage reference SHALL be fixed at rated
(1.0 pu / 400 V) and SHALL NOT be user-adjustable. When AVR is enabled, the UI SHALL make the exciter
field DC knob read-only and display the value the AVR is currently commanding; when AVR is disabled,
the field DC knob SHALL be user-adjustable. The UI SHALL additionally expose adjustable Kp and Ki
controls (Kp [0.5, 5.0], Ki [0.1, 2.0]) near the AVR selector so the user can tune the regulator.

#### Scenario: Field knob becomes read-only under AVR
- **WHEN** the user enables AVR via the selector switch
- **THEN** the exciter field DC knob becomes read-only and shows the AVR-commanded value

#### Scenario: Field knob restored when AVR disabled
- **WHEN** the user disables AVR
- **THEN** the exciter field DC knob becomes user-adjustable again

#### Scenario: Voltage reference is fixed
- **WHEN** AVR is enabled
- **THEN** the AVR regulates terminal voltage to the fixed rated reference and no Vref control is shown

#### Scenario: Tuning gains adjustable
- **WHEN** the user adjusts the Kp or Ki control
- **THEN** the AVR regulation behaviour changes accordingly (e.g. higher Kp produces visible overshoot on a field step)
