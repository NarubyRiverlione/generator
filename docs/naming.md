# UI Component Naming

Canonical names for instrument and control components used in specs, docs, and code.

---

## Instruments (read-only)

### Gauge
- **Shape**: Square bezel
- **Needles**: One
- **Examples**: Terminal voltage (Vₜ), active power (P)
- **Component**: `Gauge`

### PositionIndicator
- **Shape**: Circular bezel
- **Needles**: Two — one for setpoint (thin, red), one for actual (bold, black)
- **Examples**: Intake valve position
- **Component**: `PositionIndicator` *(to be developed; currently specced as `ValveDial`)*

---

## Controls (interactive)

### Knob
- **Behaviour**: Rotary. Set to a position; stays there. Supports slow and fast change increments.
- **Examples**: Field excitation, load
- **Component**: `Knob`

### SelectorSwitch
- **Behaviour**: Set to a position; stays there. Discrete positions only.
- **Examples**: AVR on/off
- **Component**: `SelectorSwitch` *(currently implemented inside `AvrControl`)*

### SpringLoadedSelector
- **Behaviour**: Defaults to centre (0) when released. Hold to effect a change; release to return.
- **Examples**: Governor speed-changer
- **Component**: `SpringLoadedSelector` *(currently implemented as `GovernorSwitch`)*

---

## Deprecated

### VrefControl
Removed. The Vref knob that previously lived inside `AvrControl` is no longer part of the UI.

### Dial
Not a component name. Historically used in comments and docs to refer to a `Knob` or `SpringLoadedSelector`. Use the specific name instead.
