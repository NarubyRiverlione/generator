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
- **Component**: `PositionIndicator`
- **Status**: Implemented; currently **not mounted on the panel** (removed in Stage 3d — TAU_VALVE 0.3 s makes the twin needles nearly coincident). Retained for future use (synchroscope, steam variant).

---

## Controls (interactive)

### Knob
- **Behaviour**: Rotary. Set to a position; stays there. Supports slow and fast change increments.
- **Examples**: Field excitation, load
- **Component**: `Knob`

### LoadBreaker
- **Behaviour**: Latching toggle (open / closed). Styled as panel-mount switchgear — not a logic switch. Disabled below ~1425 rpm (0.95 pu arming interlock). Closing applies the pre-set active load as a single instantaneous step.
- **Examples**: Ship load breaker (Stage 3d)
- **Component**: `LoadBreaker`

### SelectorSwitch
- **Behaviour**: Set to a position; stays there. Discrete positions only.
- **Examples**: AVR on/off, Governor on/off
- **Component**: `SelectorSwitch`

### SpringLoadedSelector
- **Behaviour**: Defaults to centre (0) when released. Hold to effect a change; release to return.
- **Examples**: Governor fine and coarse speed-changers
- **Component**: `SpringLoadedSelector`

---

## Deprecated

### VrefControl
Removed. The Vref knob that previously lived inside `AvrControl` is no longer part of the UI.

### Dial
Not a component name. Historically used in comments and docs to refer to a `Knob` or `SpringLoadedSelector`. Use the specific name instead.
