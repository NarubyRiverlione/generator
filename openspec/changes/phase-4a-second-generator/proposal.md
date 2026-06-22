## Why

Phase 3 is complete: one generator starts from cold-dark, builds voltage, holds frequency, and carries
the ship's load. Phase 4 introduces the second generator that makes the tug's power plant real — two
identical units, either of which can be the running reference while the other starts alongside it.

Stage 4a is the foundation: run both machines simultaneously. No electrical coupling yet (that is 4b),
but both simulations are live, both panels are fully operable, and the operator can see both machines
at a glance. This is the necessary precondition for the synchronisation and parallel-operation stages
that follow.

**Prerequisite:** `engine-start-stop` change fully implemented and archived. START/STOP buttons and the
idle-at-1400-rpm startup sequence must be in place for a single generator before two can be managed.

## What Changes

- **Second simulation instance.** A second independent call to `useGeneratorSimulation` runs in the
  same `useEffect` interval as the first, advancing both at the same `dt`. The two instances share no
  state — no electrical coupling in 4a.
- **Status strip (left sidebar, ~160 px).** Always-visible compact comparison of both generators:
  RPM, Hz, Vₜ (V), P (kW), breaker state, AVR armed, governor armed. Two value columns (Gen 1 | Gen 2)
  with a shared label column. Read-only — no controls in the strip.
- **Tab bar (GEN 1 / GEN 2).** Switches which full current panel is rendered on the right. Click to
  switch; keyboard shortcuts `1` / `2`. Both simulations run continuously regardless of active tab.
- **Generator symmetry.** Both generators use identical controls, identical presets, identical startup
  sequences. Neither is hard-coded as reference or incoming unit — that is an operational choice.
- **Gen 2 boots STOPPED.** Regardless of which `?start=` preset Gen 1 uses, Gen 2 always starts in the
  STOPPED state. No new presets required.
- **STOP force-trips the breaker.** If the load breaker is closed when STOP is pressed, it is opened
  immediately before the valve ramps to 0. The machine then coasts to rest via the swing equation and
  windage.

## Non-goals

- No electrical coupling between the two machines (Phase 4b).
- No synchroscope or synchro-check relay (Phase 4b).
- No droop / load sharing (Phase 4c).
- No shared bus voltage or frequency — each machine sees its own islanded state in 4a.

## Capabilities

### New Capabilities

- `dual-generator-layout`: Status strip + tab bar housing two full generator panels. The strip shows
  the read-only comparison view; the tabs switch the interactive panel. Keyboard shortcuts `1` / `2`
  switch tabs. Layout must accommodate the existing 6-column panel without modification.

### Modified Capabilities

- `second-generator-instance`: A second independent `useGeneratorSimulation` instance, ticked in the
  same interval as the first. Gen 2 always initialises from the cold-dark preset regardless of the
  active URL preset. Both instances expose the same interface; the tab bar routes user inputs to the
  active one.
- `simulator-ui`: `App.tsx` restructured to render the status strip on the left and the tabbed panel
  on the right. The existing single-generator layout is preserved inside the tab — no changes to the
  6-column grid, gauges, or controls.

## Impact

- **Hook:** `useGeneratorSimulation.ts` — instantiated twice; shared-tick orchestration in a single
  `useEffect`.
- **UI:** `App.tsx` — major layout restructure; new `StatusStrip` component; tab state (`activeGen:
  1 | 2`); `keydown` listener for `1` / `2` shortcuts.
- **Styles:** new CSS for the strip and tab bar; existing panel styles untouched.
- **Docs:** `docs/roadmap.md` — mark Stage 4a complete; update layout diagram to show strip + tabs.
- **Tests:** second-instance tick synchronisation; Gen 2 cold-dark init regardless of URL preset;
  STOP force-trips breaker before ramp.
