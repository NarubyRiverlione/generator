## MODIFIED Requirements

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
