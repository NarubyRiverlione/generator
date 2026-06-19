# Spec: Valve Dial (PositionIndicator)

## Purpose

The `PositionIndicator` component is a hand-rolled SVG circular dial that can display two needles — one for setpoint and one for actual — against a 270° arc. It is retained in the codebase for future use (e.g. synchroscope display in Phase 4 or a steam-plant variant with a longer valve lag) but is **not currently mounted in the switchboard panel**. At `τ_valve = 0.3 s` (diesel throttle) the setpoint and actual values are nearly always coincident and the instrument loses its educational value; the panel slot was replaced by a throttle-% LCD tile.

## Requirements

### Requirement: No external charting library
The `PositionIndicator` component SHALL be hand-rolled SVG with no external chart or gauge library dependency, consistent with the existing `Gauge` component.

#### Scenario: Bundle contains no new chart dependency
- **WHEN** the project is built
- **THEN** no new charting or gauge library is added to `package.json`
