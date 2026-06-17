# Spec: Simulator UI

## Purpose

The simulator UI is the React front-end for the islanded synchronous generator simulator. It presents input controls (rotary Knobs, a SelectorSwitch, and a SpringLoadedSelector), drives the simulation loop via a custom React hook, displays generator output readouts as SVG arc Gauges and numeric values, and surfaces stability warnings. All physics are delegated to the simulation core.
## Requirements
### Requirement: Input panel controls
The UI SHALL present rotary **knobs** with numeric value labels for exciter field DC (0–1.5 pu,
default 0), active load (0–100 %, default 0), and power factor (0.6 lag through 1.0 to 0.6 lead,
default 0.85 lag), an AVR on/off selector switch (default off), and a turbine governor
**speed-changer**: a spring-return raise/lower switch (neutral centre, two-stage slow/fast throw)
that drives the intake valve. The rotor speed is controlled via the valve position; the machine
starts with the valve pre-set at ~93 % (giving ~1495 rpm).

#### Scenario: Knobs show current value
- **WHEN** the user turns any input knob
- **THEN** the knob's numeric label updates to the current value in its unit

#### Scenario: Governor speed-changer present
- **WHEN** the input panel is rendered
- **THEN** a spring-return raise/lower speed-changer switch is present, and holding it raises or lowers the intake valve (and thereby rotor speed)

#### Scenario: Governor at rated valve matches rated speed
- **WHEN** the valve is at ~93.75 % (rated position)
- **THEN** simulation output shows 1500 rpm / 50 Hz

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

### Requirement: SVG arc gauge with zones
Each gauge SHALL be a hand-rolled SVG semicircular arc (~180° sweep) inside a square black-bezel frame, following the visual design in design.md D8. The arc SHALL have a dark base track and coloured zone arcs drawn on top at the same radius (no gap). Zone colours for Vₜ: amber / green / amber / red from low to high. Zone colours for P: green / red. No external charting or gauge library SHALL be used.

#### Scenario: Zone colour reflects deviation from rated
- **WHEN** a gauge value moves beyond the green zone boundary
- **THEN** the needle position enters the amber or red zone arc as appropriate

#### Scenario: No gap between zone arcs and track
- **WHEN** the gauge is rendered
- **THEN** coloured zone arcs are flush with the base track (same SVG radius), with no visible gap between the coloured band and the dark arc

### Requirement: React driver hook
A custom React hook SHALL own the animation loop (~30 ms cadence using real elapsed time), hold the current inputs and latest outputs in React state, and delegate every calculation to the pure simulation core. The hook SHALL contain no physics of its own.

#### Scenario: Hook delegates all physics to the core
- **WHEN** the hook advances one tick
- **THEN** it calls the core step function with the real elapsed time and stores the returned outputs, performing no circuit math itself

### Requirement: Responsive layout
The UI SHALL present the controls and readouts as a switchboard-style grid that follows the physical
signal chain (exciter input → exciter chain → generator output), and SHALL remain usable on narrow
viewports.

#### Scenario: Layout remains usable on narrow viewports
- **WHEN** the viewport is narrow (mobile width)
- **THEN** the grid reflows and all knobs, switches, and readouts remain usable

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

