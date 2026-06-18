## MODIFIED Requirements

### Requirement: Input panel controls
The UI SHALL present rotary **knobs** with numeric value labels for exciter field DC (`0.0-1.7 pu`,
default `0.0`), active load, and power factor, an AVR on/off selector switch (default off), and a turbine
governor **speed-changer**: a spring-return raise/lower switch (neutral centre, two-stage slow/fast throw)
that drives the intake valve. The rotor speed is controlled via the valve position; the machine starts
with the valve pre-set at ~93 % (giving ~1495 rpm).

The power-factor knob SHALL span from `0.6 lag` through `1.0` to `0.6 lead`, with both the lagging and
leading floors clamped at **0.6**. The default starting power factor SHALL be **0.92 lag**. The lagging
low-PF region is intentionally reachable even though, at full load and the machine's realistic saturation
ceiling, terminal voltage sags below the ANSI-27 trip and collapses around 0.85–0.9 PF — this limit is
left exposed as a teaching point rather than fenced off.

The spring-loaded speed-changer SHALL return to neutral on mouse/touch release and touch-cancel events.

#### Scenario: Knobs show current value
- **WHEN** the user turns any input knob
- **THEN** the knob's numeric label updates to the current value in its unit

#### Scenario: Power factor floor is 0.6 on both sides
- **WHEN** the user turns the power-factor knob below 0.6 on either the lagging or leading side
- **THEN** the power factor is clamped to 0.6 on that side

#### Scenario: Low lagging power factor collapses voltage at full load
- **WHEN** the user dials power factor toward 0.8 lag at full active load
- **THEN** terminal voltage sags below the ANSI-27 trip and the machine collapses, surfaced through the existing collapse/relay handling (the limit is reachable, not blocked)

#### Scenario: Governor speed-changer present
- **WHEN** the input panel is rendered
- **THEN** a spring-return raise/lower speed-changer switch is present, and holding it raises or lowers the intake valve (and thereby rotor speed)

#### Scenario: Touch-cancel returns selector to neutral
- **WHEN** an active touch gesture on the speed-changer is cancelled by the platform
- **THEN** the control returns to neutral and command output becomes neutral immediately

## ADDED Requirements

### Requirement: LCD saturation and load-droop readouts
The LCD SHALL display the two diagnostic signals exported by the simulation core as numeric values, so a
learner can see the new saturation and governor-droop physics directly:

- the **saturation derate** — derived from `Outputs.saturationFactor` (e.g. shown as a percentage; 100 %
  = unsaturated, below 100 % when the field is pushed above the knee), and
- the **load-droop RPM offset** — `Outputs.droopRpm`, the rpm the active load is pulling below the
  valve-only speed target.

These occupy the LCD slot previously used by the valve-position line (the valve retains its dedicated
position indicator). The reference legend / sticky note SHALL describe both values.

#### Scenario: Saturation derate shown on LCD
- **WHEN** the field is driven above the saturation knee
- **THEN** the LCD saturation-derate readout shows a value below 100 % consistent with `Outputs.saturationFactor`

#### Scenario: Load-droop RPM shown on LCD
- **WHEN** active load is applied at a fixed valve position
- **THEN** the LCD shows a non-zero load-droop rpm consistent with `Outputs.droopRpm`, and the value is 0 at no load

#### Scenario: Legend describes the new readouts
- **WHEN** the user opens the LCD reference legend
- **THEN** it includes entries explaining the saturation-derate and load-droop readouts
