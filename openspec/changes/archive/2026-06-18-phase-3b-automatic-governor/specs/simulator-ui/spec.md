## MODIFIED Requirements

### Requirement: Input panel controls
The UI SHALL present rotary **knobs** with numeric value labels for exciter field DC (`0.0-1.7 pu`,
default `0.0`), active load (`0-100 %`, default `0`), and power factor, an AVR on/off selector switch
(default off), a **governor on/off selector switch** (default off), and two turbine governor
speed-changers: a **fine** spring-return raise/lower switch (slow = 0.5 rpm/s, fast = 5 rpm/s) and a
**coarse** spring-return raise/lower switch (slow = 10 rpm/s, fast = 25 rpm/s). Both drive the intake
valve additively when the governor is off. The rotor speed is controlled via the valve position;
the machine starts with the valve pre-set at ~93 % (giving ~1495 rpm).

The power-factor knob SHALL span from `0.6 lag` through `1.0` to `0.6 lead`, with both the lagging and
leading floors clamped at **0.6**. The default starting power factor SHALL be **0.92 lag**. The lagging
low-PF region is intentionally reachable even though, at full load and the machine's realistic saturation
ceiling, terminal voltage sags below the ANSI-27 trip and collapses around 0.85–0.9 PF — this limit is
left exposed as a teaching point rather than fenced off.

The spring-loaded speed-changer SHALL return to neutral on mouse/touch release and touch-cancel events.

When the governor is enabled, the speed-changer SHALL become **read-only** and SHALL display the valve
position the governor is currently commanding (mirroring how the field knob becomes read-only under AVR).

#### Scenario: Knobs show current value
- **WHEN** the user turns any input knob
- **THEN** the knob's numeric label updates to the current value in its unit

#### Scenario: Power factor floor is 0.6 on both sides
- **WHEN** the user turns the power-factor knob below 0.6 on either the lagging or leading side
- **THEN** the power factor is clamped to 0.6 on that side

#### Scenario: Low lagging power factor collapses voltage at full load
- **WHEN** the user dials power factor toward 0.8 lag at full active load
- **THEN** terminal voltage sags below the ANSI-27 trip and the machine collapses, surfaced through the existing collapse/relay handling (the limit is reachable, not blocked)

#### Scenario: Both speed-changers present
- **WHEN** the input panel is rendered
- **THEN** both a fine and a coarse spring-return raise/lower speed-changer switch are present, and holding either raises or lowers the intake valve (and thereby rotor speed) when the governor is off

#### Scenario: Coarse switch moves valve faster than fine
- **WHEN** the coarse fast throw is held versus the fine fast throw for the same duration
- **THEN** the valve position changes approximately twice as far on the coarse throw

#### Scenario: Touch-cancel returns selector to neutral
- **WHEN** an active touch gesture on either speed-changer is cancelled by the platform
- **THEN** the control returns to neutral and command output becomes neutral immediately

#### Scenario: Both speed-changers become read-only under governor
- **WHEN** the user enables the governor via its selector switch
- **THEN** both speed-changers become read-only and show the valve position the governor is commanding

#### Scenario: Speed-changers restored when governor disabled
- **WHEN** the user disables the governor
- **THEN** both speed-changers become user-adjustable again

## ADDED Requirements

### Requirement: Governor control behavior
The governor SHALL be toggled by an on/off selector switch positioned near the speed-changer, mirroring
the AVR selector switch's relationship to the field knob. The governor frequency reference SHALL be fixed
at rated (1.0 pu / 50 Hz) and SHALL NOT be user-adjustable. When the governor is enabled, the UI SHALL
pass `governorOn: true` to the simulation inputs; when disabled, `governorOn: false`.

#### Scenario: Governor enabled passes correct input flag
- **WHEN** the user flips the governor selector switch to on
- **THEN** `inputs.governorOn` becomes `true` in the next simulation step

#### Scenario: Governor disabled passes correct input flag
- **WHEN** the user flips the governor selector switch to off
- **THEN** `inputs.governorOn` becomes `false` in the next simulation step

#### Scenario: Frequency reference is fixed
- **WHEN** the governor is enabled
- **THEN** the governor regulates to 50 Hz and no frequency-reference control is shown

### Requirement: Governor-at-ceiling indicator
The UI SHALL show a governor-at-ceiling indicator (amber) when the governor is enabled and the governor
valve command has reached its maximum (100 %), signalling that the regulator can no longer open the
valve further to raise mechanical power.

#### Scenario: Indicator lights when governor saturates
- **WHEN** the governor is enabled and its valve command reaches 100 %
- **THEN** the governor-at-ceiling indicator lights amber

#### Scenario: Indicator off when governor not at ceiling
- **WHEN** the governor is enabled but the valve command is below 100 %
- **THEN** the governor-at-ceiling indicator is off (not lit)
