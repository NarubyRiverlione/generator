# Spec: Simulator UI

## Purpose

The simulator UI is the React front-end for the islanded synchronous generator simulator. It presents input controls (rotary Knobs, a SelectorSwitch, and a SpringLoadedSelector), drives the simulation loop via a custom React hook, displays generator output readouts as SVG arc Gauges and numeric values, and surfaces stability warnings. All physics are delegated to the simulation core.
## Requirements
### Requirement: Input panel controls
The UI SHALL present rotary **knobs** with numeric value labels for exciter field DC (`0.0-1.7 pu`,
default `0.0`), active load (`0-100 %`, default `0`), and power factor; an AVR on/off selector switch
(default off); a **governor on/off selector switch** (default off); two turbine governor speed-changers
(fine and coarse spring-return raise/lower switches); and a **load breaker** control (see "Load breaker
control" requirement).

The power-factor Knob SHALL span from `0.6 lag` through `1.0` to `0.6 lead`, with both floors clamped
at **0.6**. The default starting power factor SHALL be **0.92 lag**. The spring-loaded speed-changer
SHALL return to neutral on mouse/touch release and touch-cancel events.

When the governor is enabled, the speed-changer SHALL become **read-only** and SHALL display the valve
position the governor is currently commanding.

#### Scenario: All controls present
- **WHEN** the simulator panel is rendered
- **THEN** the exciter field, active load, and power factor knobs are visible; the AVR and governor selector switches are visible; both speed-changers are visible; and the load breaker control is visible

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

### Requirement: Load breaker control
The UI SHALL provide a **load breaker** control that toggles `inputs.loadBreaker`. It SHALL be
visually distinct from the `SelectorSwitch` components — styled as panel-mount switchgear, not a
logic switch. It SHALL display its state clearly: **OPEN** (load disconnected) or **CLOSED** (load
connected).

The control SHALL be **disabled and unresponsive** when `omega < 0.95 pu` (~1425 rpm), and SHALL
show a visual disabled state in that condition. Above 0.95 pu it is interactive.

#### Scenario: Breaker shows current state
- **WHEN** `loadBreaker` is `false`
- **THEN** the control reads OPEN; when `true` it reads CLOSED

#### Scenario: Breaker disabled below arming speed
- **WHEN** `omega` is below 0.95 pu
- **THEN** the breaker control is visually dimmed and clicking/tapping has no effect

#### Scenario: Closing the breaker triggers an immediate load step
- **WHEN** the operator clicks the breaker to close while `omega ≥ 0.95 pu`
- **THEN** `inputs.loadBreaker` becomes `true` and the simulation responds with an instantaneous load step in the next tick

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

### Requirement: Generator output readouts
The UI SHALL display terminal voltage (Vₜ) and active power (P) as SVG arc gauges and numeric values,
and SHALL display reactive power (Q), load angle (δ), calculated power factor, shaft speed in **RPM**
(headline), output frequency in **Hz**, **throttle position** (`valveActual` %, replacing the valve
position previously shown via `PositionIndicator`), and damping torque as numeric values on the LCD.
Q SHALL be labelled "supplying" when positive and "absorbing" when negative.

The `PositionIndicator` (twin-needle valve dial) SHALL be **removed from the switchboard grid** (the
component is retained in the codebase for future use; it is not rendered in the panel).

#### Scenario: Throttle % shown instead of PositionIndicator
- **WHEN** the simulator panel is rendered
- **THEN** a throttle-% tile showing `valveActual` appears on the LCD; no `PositionIndicator` is mounted in the panel grid

#### Scenario: Gauges and numerics update as the simulation settles
- **WHEN** the simulation state changes and settles
- **THEN** the Vₜ and P gauges and all numeric readouts — including RPM, Hz, throttle %, and damping torque — update continuously

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

### Requirement: Field-at-ceiling indicator
The UI SHALL show a field-at-ceiling indicator (amber) when AVR is enabled and the AVR field command
has reached its maximum (≥ ceiling), signalling that the regulator can no longer raise excitation to
hold voltage.

#### Scenario: Indicator lights when AVR saturates
- **WHEN** AVR is enabled and its field command reaches the ceiling
- **THEN** the field-at-ceiling indicator lights amber

### Requirement: LCD saturation and power-balance readouts
The LCD SHALL display diagnostic signals exported by the simulation core as numeric values:

- **Saturation derate** — derived from `Outputs.saturationFactor` (shown as a percentage; 100 % =
  unsaturated, below 100 % when the field is pushed above the knee)
- **Power balance** — the imbalance `Outputs.pm − Outputs.p` (`Pm − Pe`, pu or kW): positive
  accelerates the rotor, negative decelerates it, zero holds frequency
- **Throttle %** — `Outputs.valveActual` as a percentage, showing where the governor is driving the
  fuel rack (replaces the `PositionIndicator` panel slot)
- **Damping torque** — `Outputs.dampingTorque` (pu), the passive amortisseur torque proportional to
  slip: zero at synchronous speed, spikes transiently during load steps

The reference legend SHALL describe all four values.

#### Scenario: Saturation derate shown on LCD
- **WHEN** the field is driven above the saturation knee
- **THEN** the LCD saturation-derate readout shows a value below 100 % consistent with `Outputs.saturationFactor`

#### Scenario: Power balance shown on LCD
- **WHEN** the load draws more active power than the valve commands (`Pe > Pm`)
- **THEN** the LCD power-balance readout shows a negative imbalance consistent with `Outputs.pm − Outputs.p`, and reads ≈ 0 when the operator has rebalanced `Pm ≈ Pe`

#### Scenario: Throttle % tile present
- **WHEN** the panel is rendered
- **THEN** the LCD includes a tile showing `valveActual` as a percentage

#### Scenario: Damping torque tile present
- **WHEN** the panel is rendered
- **THEN** the LCD includes a tile showing `Outputs.dampingTorque`

#### Scenario: Damping torque shows zero at steady state
- **WHEN** the machine is running at synchronous speed (`omega = 1.0 pu`) with no transient
- **THEN** the damping-torque tile reads ≈ 0

#### Scenario: Damping torque spikes after breaker close
- **WHEN** the load breaker is closed at a non-trivial load
- **THEN** the damping-torque tile shows a non-zero transient value proportional to the frequency dip

#### Scenario: Legend describes all readouts
- **WHEN** the user opens the LCD reference legend
- **THEN** it includes entries for saturation derate, power balance, throttle %, and damping torque

### Requirement: Start-point preset registry
The simulator SHALL provide a fixed, code-defined registry of named start-point presets, each defined as
`{ inputs: Partial<Inputs>, seed: Partial<SimState> }`, plus a `BOOT_PRESET` const naming the
compile-time default preset (shipping `cold-dark`). The registry SHALL include at least:
- `cold-dark` — fully at rest: zero field, valve closed (`valveActual = 0`, `valveCommand = 0`),
  `omega = 0` (shaft not turning), no load. This is the deliberate cold-start point from which the
  operator runs the shaft up under the swing equation.
- `spinning-dark` — shaft pre-spun to ~1495 rpm (`valveActual ≈ 93.4 %`, `omega ≈ 0.9967`), zero field
  (dark, Vt = 0), no load. Its empty seed reproduces the default `initialState()` boot field-for-field
  (the regression anchor).
- `live-loaded` — a settled, loaded islanded operating point: field built up (≈ rated), valve ≈ 93 %,
  near-synchronous speed, and some active load — booting already settled with no multi-second lag wait.

A `resolvePreset(name?)` helper SHALL return the named preset, or `BOOT_PRESET` when the name is missing
or unrecognised.

#### Scenario: Known preset resolves to its definition
- **WHEN** `resolvePreset('live-loaded')` is called
- **THEN** it returns the `live-loaded` preset with its `inputs` and settled `seed`

#### Scenario: spinning-dark reproduces today's boot
- **WHEN** the state seeded from the `spinning-dark` preset is compared to no-argument `initialState()`
- **THEN** they are field-for-field identical

#### Scenario: Unknown or missing name falls back to BOOT_PRESET
- **WHEN** `resolvePreset(undefined)` or `resolvePreset('does-not-exist')` is called
- **THEN** it returns the `BOOT_PRESET` preset (`cold-dark` as shipped)

### Requirement: URL-selected start point
The simulator SHALL resolve a start-point preset once at startup from the `start` URL query parameter
(e.g. `?start=live-loaded`) and seed both the input knob positions and the simulation state from the
resolved preset. A valid `start` value overrides `BOOT_PRESET`; an unknown or absent value SHALL fall
back to `BOOT_PRESET`. The driver hook SHALL accept the resolved preset (or its name) rather than reading
`window` itself.

#### Scenario: URL parameter selects a preset
- **WHEN** the app loads with `?start=live-loaded`
- **THEN** the inputs and simulation state are seeded from the `live-loaded` preset, so the machine boots already settled at a loaded operating point rather than cold

#### Scenario: Absent or unknown parameter boots BOOT_PRESET
- **WHEN** the app loads with no `start` parameter, or with `?start=bogus`
- **THEN** the simulator boots from `BOOT_PRESET` (`cold-dark` as shipped — fully at rest, which differs from today's pre-spun boot)

