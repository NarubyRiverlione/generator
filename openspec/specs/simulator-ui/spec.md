# Spec: Simulator UI

## Purpose

The simulator UI is the React front-end for the islanded synchronous generator simulator. It presents input controls (sliders, AVR toggle), drives the simulation loop via a custom React hook, displays generator output readouts as SVG arc gauges and numeric values, and surfaces stability warnings. All physics are delegated to the simulation core.

## Requirements

### Requirement: Input panel controls
The UI SHALL present sliders with numeric value labels for exciter field DC (0.5–1.5 pu, default 1.0), active load (0–100 %, default 50), and power factor (0.6 lag through 1.0 to 0.6 lead, default 0.85 lag), plus an AVR on/off toggle (default off). The rotor speed / frequency SHALL be fixed at 50 Hz and SHALL NOT be exposed as a control.

#### Scenario: Sliders show current value
- **WHEN** the user drags any input slider
- **THEN** the adjacent numeric label updates to the current value in its unit

#### Scenario: No rotor-speed control in MVP
- **WHEN** the input panel is rendered
- **THEN** there is no rotor-speed or frequency slider and no frequency readout

### Requirement: AVR control behavior
When AVR is enabled, the UI SHALL make the exciter field DC slider read-only and display the value the AVR is currently commanding, and SHALL reveal an AVR voltage-reference slider (380–420 V, default 400). When AVR is disabled, the Vref slider SHALL be hidden and the field DC slider SHALL be user-adjustable.

#### Scenario: Field slider becomes read-only under AVR
- **WHEN** the user enables AVR
- **THEN** the exciter field DC slider becomes read-only, shows the AVR-commanded value, and the Vref slider becomes visible

#### Scenario: Field slider restored when AVR disabled
- **WHEN** the user disables AVR
- **THEN** the exciter field DC slider becomes user-adjustable again and the Vref slider is hidden

### Requirement: Generator output readouts
The UI SHALL display terminal voltage (Vₜ) and active power (P) as SVG arc gauges and numeric values, and SHALL display reactive power (Q), load angle (δ), and calculated power factor as numeric values. Q SHALL be labelled "supplying" when positive and "absorbing" when negative.

#### Scenario: Gauges and numerics update as the simulation settles
- **WHEN** the simulation state changes and settles
- **THEN** the Vₜ and P gauges and all numeric readouts update continuously to reflect the current solved values

#### Scenario: Reactive power direction labelled
- **WHEN** the solved Q is negative (leading/capacitive load)
- **THEN** the Q readout is labelled "absorbing"; when Q is positive it is labelled "supplying"

### Requirement: SVG arc gauge with zones
Each gauge SHALL be a hand-rolled SVG semicircular arc (~180° sweep) inside a square black-bezel frame, following the visual design in design.md D8. The arc SHALL have a dark base track and coloured zone arcs drawn on top at the same radius (no gap). Zone colours for Vₜ: amber / green / amber / red from low to high. Zone colours for P: green / red. No external charting or gauge library SHALL be used.

#### Scenario: Zone colour reflects deviation from rated
- **WHEN** a gauge value moves beyond the green zone boundary
- **THEN** the needle position enters the amber or red zone arc as appropriate

#### Scenario: No gap between zone arcs and track
- **WHEN** the gauge is rendered
- **THEN** coloured zone arcs are flush with the base track (same SVG radius), with no visible gap between the coloured band and the dark arc

### Requirement: Load-angle stability warning
The UI SHALL show a stability warning as the load angle δ approaches 90°, and SHALL surface the collapsed/unstable state reported by the core when load exceeds maximum loadability.

#### Scenario: Warning near the stability limit
- **WHEN** the load angle δ approaches 90°
- **THEN** a visible stability warning is shown on the δ readout

#### Scenario: Collapsed state surfaced
- **WHEN** the core reports a collapsed state
- **THEN** the UI shows an explicit unstable/collapsed indication rather than blank or NaN readouts

### Requirement: React driver hook
A custom React hook SHALL own the animation loop (~30 ms cadence using real elapsed time), hold the current inputs and latest outputs in React state, and delegate every calculation to the pure simulation core. The hook SHALL contain no physics of its own.

#### Scenario: Hook delegates all physics to the core
- **WHEN** the hook advances one tick
- **THEN** it calls the core step function with the real elapsed time and stores the returned outputs, performing no circuit math itself

### Requirement: Responsive layout
The UI SHALL present a single page with a two-column layout on desktop and a stacked layout on mobile, ordering the readouts to follow the physical signal chain (exciter input → exciter chain → generator output).

#### Scenario: Layout stacks on narrow viewports
- **WHEN** the viewport is narrow (mobile width)
- **THEN** the columns stack vertically and all controls and readouts remain usable
