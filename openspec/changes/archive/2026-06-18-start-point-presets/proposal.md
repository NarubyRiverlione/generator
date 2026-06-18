## Why

The simulator always boots from one hardcoded state: `DEFAULT_INPUTS` (knob positions) plus a fixed
`initialState()` that derives the dynamic state from those inputs and the constants `SPEED_INIT_PU` /
`VALVE_PCT_INIT` (`src/core/simulation.ts`, `src/core/constants.ts`). Two problems:

- **Debugging / experimentation is slow.** To reach an interesting operating point (field built up, shaft
  spun up, valve crept to ~93 %) you must wait for the lags to settle every reload — the field lag (1.5 s),
  spin-up lag (2.5 s) and valve actuator lag (2.0 s) all have to play out.
- **Phase 3 introduces genuinely new start states.** "Cold & dark" (at rest, breaker open) becomes the
  canonical Phase 3 starting experience, and a "warm islanded / sync-ready" state is the Phase 4 entry
  point. A named-start-point mechanism is scaffolding those phases will lean on directly.

The key insight: **a useful start point is not just knob positions — it is the settled *dynamic* state.**
Seeding only `Inputs` still boots cold and forces a multi-second settle. To be useful for both fast
debugging and reproducible fixtures, a preset must seed the lagged/dynamic state too (`iField`,
`exciterLagged`, `speedLagged`, `valveActual`, …).

## What Changes

- **Add a small registry of named start-point presets**, each defined as:

  ```
  preset = {
    inputs: Partial<Inputs>,      // knob positions
    seed:   Partial<SimState>,    // settled dynamic state (laggeds, speed, valve)
  }
  ```

  Initial presets (expressed in the *current* state vocabulary — no breaker/`ω` yet, since this change
  lands before Phase 3a):
  - **`cold-dark`** (the shipped default — see `BOOT_PRESET` below) — fully at rest: `fieldVoltage = 0`,
    `valveCommand = 0`, `valveActual = 0`, `speedLagged = 0` (shaft not turning), no load. **Note:** this
    is a *change* from today's boot state, which starts pre-spun (see `spinning-dark`). It is the natural
    starting point for Phase 3a run-up from rest.
  - **`spinning-dark`** — today's literal boot state, preserved verbatim: shaft pre-spun to ~1495 rpm
    (`valveActual ≈ 93.4 %`, `speedLagged ≈ 0.9967`), `fieldVoltage = 0` (dark — Vt = 0), no load. This
    is the actual current out-of-box experience, kept available as a preset.
  - **`live-loaded`** — a genuinely warm operating point for fast experiments / debugging: field built up
    so Vt ≈ rated, valve ~93 %, near-synchronous speed, **and** some active load — so you land
    mid-experiment at a live operating point rather than dialling field and load in by hand each reload.

- **Add a `BOOT_PRESET` const** (in the preset registry module) naming the compile-time default start
  point, e.g. `export const BOOT_PRESET: PresetName = 'cold-dark'`. This is the single line a developer
  flips to change where every reload starts — no URL juggling. Ships as `cold-dark`.
- **Grow `initialState()` to accept an optional seed**: `initialState(seed?: Partial<SimState>)`, so a
  preset can install a *settled* dynamic state directly (no waiting for lags). The default (no-seed) call
  remains valid and equivalent to today's default behaviour.
- **Select the preset via a URL parameter** (e.g. `?start=live-loaded`), resolved once at startup in the
  driver hook / App. Resolution order: a valid `?start=<name>` wins; otherwise fall back to `BOOT_PRESET`;
  an unknown value falls back to `BOOT_PRESET`. So the const sets the floor, the param overrides it.
- **Wire the hook** (`useGeneratorSimulation`) to seed both `useState<Inputs>` and the `SimState` ref from
  the resolved preset instead of the bare `DEFAULT_INPUTS` / `initialState()`.

## Non-goals

- **No in-app preset picker UI** in this change — URL parameter only (a UI selector could be a later
  refinement).
- **No persistence / save-your-own-state** — the registry is a fixed, code-defined set, not user-authored
  snapshots.
- **No new physics** — this only changes *where the simulation starts*, never how it evolves.
- The exact Phase 3 presets (mid-run-up, sync-ready, grid-tied) are **out of scope until those stages
  exist**; this change establishes the mechanism and the three presets that make sense today
  (`cold-dark`, `spinning-dark`, `live-loaded`).

## Default preset

The default is whatever `BOOT_PRESET` names, trivially changed in one line — so the choice is not a
hard commitment. Ships as **`cold-dark`** (the intended long-term vanilla and Phase 3a's run-up start).
Note this *changes today's out-of-box experience*: the shaft currently boots pre-spun, so before Phase 3a
exists a `cold-dark` default means the shaft starts at 0 rpm and the operator jogs the valve up under the
existing kinematic model — usable, just a different first impression. If that first impression matters
before Phase 3a lands, flip `BOOT_PRESET` to `spinning-dark` until then.

## Capabilities

### Modified Capabilities

- `simulation-core`: `initialState()` accepts an optional dynamic-state seed so a caller can install a
  settled operating point directly.
- `simulator-ui`: resolve a start-point preset from a URL parameter at startup and seed both inputs and
  simulation state from it, with a safe default fallback.

## Impact

- Affected specs: `simulation-core` (seeded initial state), `simulator-ui` (URL-selected start point).
- Affected code: `src/core/simulation.ts` (`initialState` signature), a new preset registry module
  (e.g. `src/core/presets.ts`) exporting the three presets and the `BOOT_PRESET` default const,
  `src/hooks/useGeneratorSimulation.ts` (seed inputs + state ref from the resolved preset), `src/App.tsx`
  (URL-param resolution, falling back to `BOOT_PRESET`).
- Independent of Phase 3 — can land before or alongside it, and pays for itself immediately as a
  debugging/experimentation aid and a clean test-fixture mechanism.
