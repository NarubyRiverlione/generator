## 1. CSS — circular bezel variants

- [ ] 1.1 Add `.round-bezel` class to `src/index.css` (same dark gradient and padding as `.sq-bezel`, `border-radius: 50%`, true square bounding box)
- [ ] 1.2 Add `.round-face` class to `src/index.css` (`border-radius: 50%`, same `background: var(--dial)`)

## 2. ValveDial component

- [ ] 2.1 Create `src/components/ValveDial.tsx` with geometry constants: viewBox 130×130, center (65,65), radius 52, A_START at 225° (7 o'clock), A_END at 315° (5 o'clock), 270° sweep
- [ ] 2.2 Implement `fracToXY(f)` helper mapping [0,1] to arc coordinates
- [ ] 2.3 Implement `zonePath(f0, f1)` helper for coloured arc segments (single green zone 0→1 initially)
- [ ] 2.4 Render dark base track arc and green zone arc
- [ ] 2.5 Render tick marks at fractions 0, 0.25, 0.5, 0.75, 1.0 with percentage labels (0, 25, 50, 75, 100)
- [ ] 2.6 Render actual needle: `stroke="#111"`, `strokeWidth=2.5`, tip at 82% of radius, square hub at pivot
- [ ] 2.7 Render setpoint needle: `stroke="#c0392b"`, `strokeWidth=1.5`, tip at 75% of radius with open chevron (`<polygon>` outline, `fill="none"`)
- [ ] 2.8 Add card label slot and `children` prop slot (same structure as `Gauge`)
- [ ] 2.9 Add `aria-label` to the SVG combining both values

## 3. Wiring into App

- [ ] 3.1 Import `ValveDial` in `src/App.tsx`
- [ ] 3.2 Mount `ValveDial` in the switchboard grid, passing `setpoint` and `actual` props from simulation outputs (exact prop source determined by companion change — use placeholder values or `valvePct` for both until that change lands)
