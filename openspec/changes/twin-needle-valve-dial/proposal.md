## Why

The existing simulator has no visual indication of valve position: the operator jogs the speed-changer but sees only the lagging RPM/Hz result, with no feedback on where the valve setpoint stands or how far the actual position trails it. A twin-needle valve-position dial makes that gap — the signature of governor transient behaviour — visible and immediate.

## What Changes

- Add a new `PositionIndicator` SVG component: a circular-bezel indicator with a 270° arc, housing two concentric needles sharing a center pivot.
- Setpoint needle (thin, red, open chevron tip) tracks the commanded valve position driven by the speed-changer control.
- Actual needle (bold, black, solid) tracks the lagged valve position as it slowly follows the setpoint.
- The `PositionIndicator` occupies a standard `gauge-col` (138 px wide) so the switchboard grid needs no layout changes.
- The circular bezel is styled with `border-radius: 50%` on a true square bounding box, distinct from but consistent with the existing square-bezel Gauges.

## Capabilities

### New Capabilities
- `position-indicator`: Twin-needle SVG `PositionIndicator` showing valve setpoint vs. actual position on a 270° circular face, using the realistic convention of bold-black actual + thin-red setpoint pointer.

### Modified Capabilities

_(none — no existing requirement changes)_

## Impact

- **New file**: `src/components/PositionIndicator.tsx`
- **`src/App.tsx`**: mounts `PositionIndicator` in the switchboard grid; passes setpoint and actual values as props.
- **`src/index.css`**: adds `.round-bezel` and `.round-face` variants (circular counterpart to `.sq-bezel` / `.sq-face`).
- No changes to simulation core, physics, or types — this is a pure UI addition.
