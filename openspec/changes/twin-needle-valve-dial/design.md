## Context

The switchboard currently has square-bezel SVG arc gauges (Gauge.tsx, ~104° sweep, viewBox 130×120, pivot at bottom-center (65,104)). They sit in 138px `gauge-col` columns. A twin-needle valve-position dial requires a wider arc to make the setpoint-vs-actual gap legible; the circular bezel is the natural shape for a 270° sweep inside the same footprint.

## Goals / Non-Goals

**Goals:**
- New `PositionIndicator` component: circular bezel, 270° arc, two needles sharing a center pivot.
- Drop-in within the existing `gauge-col` 138px column — no grid changes.
- Realistic twin-pointer convention: bold black actual + thin red open-tipped setpoint.
- CSS-only circular bezel using `border-radius: 50%` on a true square bounding box.

**Non-Goals:**
- No changes to simulation physics or types.
- No changes to existing `Gauge` component or its CSS classes.
- This change does not decide what values the `PositionIndicator` shows — the connected `valveSetpoint` and `valveActual` props are provided by the caller (decided in a separate change).

## Decisions

### D1 — Circular bezel via CSS, not SVG
`border-radius: 50%` on `.round-bezel` and `.round-face` (true square bounding box, same padding as `.sq-bezel`). The SVG face inside is still rectangular; the circle is a clipping cosmetic. No SVG mask needed.

**Alternative considered:** SVG `<circle>` clip-path on the face. Rejected — adds SVG complexity for a purely cosmetic effect that CSS handles cleanly.

### D2 — 270° arc, 90° dead zone at the bottom
Start angle: 225° from 3 o'clock (i.e. 7 o'clock position). End angle: 315° (5 o'clock). Dead zone at bottom holds the unit/label text. Pivot at face center (65,65) in a 130×130 viewBox.

**Alternative considered:** 240° arc (same as many real servo indicators). Rejected — 270° fills the face better at this size and gives cleaner 0/25/50/75/100% tick positions every 67.5°.

### D3 — Two independent needle elements, same pivot
Both needles are SVG `<line>` elements from `(CX, CY)` to their respective tip point.

- **Actual** (truth): `stroke="#111"`, `strokeWidth=2.5`, tip at 82% of radius — same weight as existing Gauge needle.
- **Setpoint** (demand): `stroke="#c0392b"` (red), `strokeWidth=1.5`, tip at 75% of radius with an open chevron (`<polygon>` outline, no fill) to provide shape differentiation alongside colour.

**Alternative considered:** Setpoint as a rim-riding "bug" index (Foxboro style). Rejected — user explicitly wants two needles from a shared pivot.

### D4 — Component receives two props, no internal state
`PositionIndicator` accepts `setpoint: number` and `actual: number` (both in the same unit/range as the connected simulation values). No animation or lag inside the component — that belongs in the simulation hook.

### D5 — Shared `fracToXY` / `needleTip` geometry helpers
Same helper pattern as `Gauge.tsx` but with updated constants. The helpers are local to `PositionIndicator.tsx` (no shared utility file) to keep the component self-contained, consistent with the existing `Gauge` approach.

## Risks / Trade-offs

- [Needle overlap at rest] When setpoint ≈ actual, both needles stack. Mitigation: the colour and weight difference still distinguishes them; the actual needle is drawn last (on top in SVG paint order) so it is always visible.
- [One round bezel in a row of square bezels] Intentional accent. The synchroscope convention justifies a round instrument for a rotary-position indicator.

## Open Questions

- None — values (what setpoint/actual represent) are decided in the companion change.
