## ADDED Requirements

### Requirement: Load breaker control
The UI SHALL provide a **load breaker** button (momentary-to-latch, not a Knob or SelectorSwitch) that
connects or disconnects the ship's load in a single instantaneous step. The breaker state SHALL be
exposed as `loadBreaker: boolean` in `Inputs` (default `false` = open = load disconnected).

When the breaker is **open** (`loadBreaker = false`), the active-load Knob sets the load level that
will be applied on close, but no electrical power is drawn (`Pe = 0`). When the breaker is **closed**
(`loadBreaker = true`), the full pre-set Knob value is applied immediately to the machine.

The breaker SHALL be visually distinct from the SelectorSwitch controls (AVR, governor). It represents
a high-current power switchgear device, not a control-system enable.

#### Scenario: Open breaker disconnects load
- **WHEN** `loadBreaker` is `false`
- **THEN** the simulation computes with zero load demand (`p = 0`, `q = 0`) regardless of the active-load Knob position, and `Vt` settles to the no-load voltage `Ea`

#### Scenario: Closing breaker applies instantaneous load step
- **WHEN** `loadBreaker` transitions from `false` to `true` while the active-load Knob is at a non-zero value
- **THEN** the full pre-set load is applied in the next simulation step, `Pe` jumps to the Knob value, and the swing equation integrates the power imbalance `Pm − Pe`

#### Scenario: Frequency dips after breaker close at high load
- **WHEN** the breaker is closed at a load level where `Pe > Pm`
- **THEN** `frequencyHz` drops below 50 Hz immediately after close, and the governor (if on) races to raise `Pm`; if the step is too large and the governor cannot recover, frequency collapses

#### Scenario: Open breaker restores no-load voltage
- **WHEN** the breaker is opened while carrying load
- **THEN** `Pe` drops to 0, the swing equation now has `Pm > Pe`, the rotor accelerates, and `Vt` rises toward `Ea` (load rejection — the rotor overspeeds until the governor responds)

#### Scenario: Breaker defaults open in all presets
- **WHEN** the simulator starts with any preset
- **THEN** `loadBreaker` is `false` (load disconnected); the active-load Knob may be pre-set but no load is connected until the operator closes the breaker

### Requirement: Load breaker arming logic
The load breaker SHALL only be closeable (interactive) when the machine is running at or near rated
speed (≥ 0.95 pu ≈ 1425 rpm). Below this threshold the breaker button SHALL be visually disabled and
unresponsive. This mirrors the real-world interlock that prevents closing a breaker onto a machine
running well below synchronous speed.

#### Scenario: Breaker disabled below arming speed
- **WHEN** `omega` is below 0.95 pu
- **THEN** the breaker button is visually dimmed/disabled and clicking it has no effect

#### Scenario: Breaker enabled at rated speed
- **WHEN** `omega` is at or above 0.95 pu
- **THEN** the breaker button is interactive and can be toggled open or closed
