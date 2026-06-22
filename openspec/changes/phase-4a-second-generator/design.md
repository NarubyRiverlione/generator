## Context

Phase 3d shipped a single generator: cold-start, AVR, isochronous governor, load breaker. The hook
(`useGeneratorSimulation`) owns its own `requestAnimationFrame` loop internally. `App.tsx` calls it
once and renders the 6-column panel.

Phase 4a adds a second, independent generator alongside the first. The key constraints are:
- Both simulations must advance on the **same tick** (prerequisite for the Phase 4b synchroscope)
- The existing 6-column panel must render **unchanged** for each generator
- Gen 2 always boots **cold-dark** regardless of the URL preset

## Goals / Non-Goals

**Goals:**
- Two independent generator simulations advancing on one shared rAF tick
- Left sidebar status strip (read-only, both gens at a glance)
- Tab bar (GEN 1 / GEN 2) switching which full panel is rendered
- Keyboard shortcuts `1` / `2` for tab switching
- Gen 2 always cold-dark; Gen 1 uses URL preset as before
- STOP force-trips the load breaker before ramping valve to 0 (already implemented; no change)

**Non-Goals:**
- No electrical coupling between instances (Phase 4b)
- No synchroscope (Phase 4b)
- No droop / load sharing (Phase 4c)
- No new physics, constants, or simulation logic

## Decisions

### D1 — Split hook into state layer + shared rAF orchestrator

`useGeneratorSimulation` currently owns its own rAF loop. Two independent rAF loops would run at
approximately the same cadence but not be guaranteed to advance with identical `dt`, violating the
shared-tick spec requirement.

**Solution:** refactor in two parts:

1. **`useGeneratorState(presetName?)`** — contains all the state management, refs, engine command
   handling, auto-ramp logic, relay logic, and a `tick(dt: number)` method. Does **not** start a
   rAF loop. Returns the same `SimHook` interface plus `tick`.

2. **Single rAF loop in `App.tsx`** — one `useEffect` with a `requestAnimationFrame` callback that
   calls `gen1.tick(dt)` then `gen2.tick(dt)` sequentially with the same `dt`. This loop replaces the
   one that was inside the hook.

`useGeneratorSimulation` is retained as a thin wrapper (`useGeneratorState` + its own rAF loop) so
no other consumers break. In Phase 4a, `App.tsx` calls `useGeneratorState` directly.

### D2 — Extract `GeneratorPanel` component from `App.tsx`

The 6-column panel JSX (all content inside `<div className="panel">`) is extracted to a new
`src/GeneratorPanel.tsx` component. It accepts the `SimHook` interface as props — exactly the shape
already returned by `useGeneratorSimulation` — so no prop shape changes are needed.

`App.tsx` becomes the dual-gen orchestrator: two `useGeneratorState` calls, one rAF loop,
`StatusStrip`, tab bar, and `<GeneratorPanel>` for the active generator.

### D3 — New `StatusStrip` component

`src/components/StatusStrip.tsx` accepts two `Outputs` + two `Inputs` objects (gen1, gen2) and
renders the ~160 px read-only sidebar. No internal state. Pure display component.

Fields per column, in order: RPM, Hz, Vt (V), P (kW), BKR, AVR, GOV. Shared label column on the
right. Indicator dots for BKR/AVR/GOV: filled circle = active/closed, hollow = off/open.

AVR dot is filled when `inputs.avrOn && outputs.rpm * RPM_RATED >= OMEGA_AVR_ENABLE * RPM_RATED`
(i.e. armed and enabled). GOV dot follows the same pattern with the governor arm threshold.

### D4 — Tab state and keyboard shortcut in `App.tsx`

`activeGen: 1 | 2` held in `useState`. A single `keydown` listener on `document` maps `'1'` and
`'2'` to tab selection, guarded by `event.target instanceof HTMLInputElement` to avoid firing inside
text inputs. Listener is registered in a `useEffect` with proper cleanup.

### D5 — Title / footer update

Footer updated to reflect Phase 4a: `PHASE 4A · 400 V · 50 Hz · 1 MVA · ISLANDED · DUAL GENERATOR`.
Panel title updated to `SYNCHRONOUS GENERATORS · 400 V · 50 Hz · 1 MVA · ISLANDED`.

### D6 — CSS layout

Two new style rules added to the existing CSS:

- `.app-layout` — `display: flex; flex-direction: row` wrapping the strip and the panel area
- `.panel-area` — `flex: 1; min-width: 0` so the panel takes remaining width
- `.status-strip` — `width: 160px; flex-shrink: 0`
- `.tab-bar` — flex row of two tab buttons above the panel; active tab visually distinguished

Existing `.panel`, `.switchboard-grid`, and breakpoint rules are untouched.

## Component Map

```
App.tsx
  useGeneratorState('cold-dark' | preset)   ← gen1
  useGeneratorState('cold-dark')             ← gen2
  rAF loop (calls gen1.tick + gen2.tick)
  │
  ├── StatusStrip (gen1.inputs, gen1.outputs, gen2.inputs, gen2.outputs)
  │
  └── panel-area
        TabBar (activeGen, onSwitch)
        GeneratorPanel (activeGen === 1 ? gen1 : gen2)

GeneratorPanel.tsx
  props: SimHook (inputs, outputs, setInput, relay27Tripped, resetRelay27,
                  setValveCommand, setLoadBreaker, startEngine, stopEngine)
  → unchanged 6-column panel JSX (extracted from current App.tsx)

StatusStrip.tsx
  props: { gen1: { inputs, outputs }, gen2: { inputs, outputs } }
  → read-only sidebar

useGeneratorState.ts  (new — extracted from useGeneratorSimulation.ts)
  → state + refs + engine command + auto-ramp + relay logic + tick(dt)
  → returns SimHook & { tick: (dt: number) => void }

useGeneratorSimulation.ts  (retained as thin wrapper)
  → useGeneratorState + own rAF loop
  → returns SimHook (unchanged interface)
```

## Risks / Trade-offs

- **rAF refactor scope** — touching `useGeneratorSimulation` carries regression risk for the single-gen
  path. Mitigation: keep `useGeneratorSimulation` as a wrapper; test that the single-gen presets still
  work after the refactor.
- **React render batching** — two `tick()` calls inside one rAF callback will each call `setOutputs`;
  React 18 batches these automatically, so one render per frame, not two. No action needed.
- **Strip width at small breakpoints** — the 160 px strip is fixed; at 540 px viewport the panel area
  gets 380 px, which is tight but consistent with the existing "shrink, don't stack" policy.

## Open Questions

None blocking implementation.
