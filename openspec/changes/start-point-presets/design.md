## Context

The simulator boots from a single hardcoded state: `DEFAULT_INPUTS` (knob positions) plus
`initialState()`, which derives the dynamic state from those inputs and the module-private constants
`SPEED_INIT_PU` / `VALVE_PCT_INIT` (`src/core/simulation.ts:30-81`). The hook
`useGeneratorSimulation` seeds `useState<Inputs>(DEFAULT_INPUTS)` and `useRef<SimState>(initialState())`
once at mount (`src/hooks/useGeneratorSimulation.ts:21-26`).

Two pressures motivate a named-start-point mechanism:

- Reaching an interesting operating point requires waiting out the stacked lags every reload
  (τ_exciter 0.4 s, τ_field 1.1 s, τ_spinup 2.5 s, τ_valve 2.0 s).
- Phase 3 introduces genuinely new start states ("cold & dark", "warm islanded / sync-ready"). A
  preset registry is scaffolding those phases lean on directly.

The key insight from the proposal: a useful start point is the settled *dynamic* state, not just knob
positions. Seeding only `Inputs` still boots cold and forces a multi-second settle, so a preset must be
able to seed the lagged state (`iField`, `exciterLagged`, `speedLagged`, `valveActual`, `valvePct`).

## Goals / Non-Goals

**Goals:**

- A small, code-defined registry of named start-point presets, each `{ inputs: Partial<Inputs>, seed: Partial<SimState> }`.
- `initialState()` accepts an optional `Partial<SimState>` seed so a settled operating point installs directly.
- A `BOOT_PRESET` const naming the compile-time default start point (ships `cold-dark`), trivially flipped during development.
- Three initial presets: `cold-dark` (at rest — the shipped default), `spinning-dark` (today's literal boot — the regression anchor), and `live-loaded` (a warm, loaded operating point for fast experiments).
- Preset resolved once at startup from a URL parameter (`?start=<name>`), overriding `BOOT_PRESET`, with a safe fallback.
- The no-seed `initialState()` path stays byte-for-byte equivalent to today's boot (captured as `spinning-dark`). The *shipped default start point* is `BOOT_PRESET` = `cold-dark`, which **intentionally changes** the boot to fully at rest.

**Non-Goals:**

- No in-app preset picker UI — URL parameter only.
- No persistence / user-authored snapshots — the registry is fixed and code-defined.
- No new physics — only *where* the simulation starts changes, never how it evolves.
- No Phase 3 presets (mid-run-up, sync-ready, grid-tied) until those stages exist.

## Decisions

**`initialState(inputs, seed?)` derives `lastValidOutputs` from the seeded laggeds + preset inputs.**
The signature becomes `initialState(inputs: Inputs = DEFAULT_INPUTS, seed?: Partial<SimState>)`. The
laggeds (`iField`, `exciterLagged`, `speedLagged`, `valvePct`, `valveActual`) come from the seed where
present, falling back to the values derived from `inputs`. `lastValidOutputs` is then solved the *same
way `step()` does* — `ea = saturation(iField) × speedLagged`, `solveMachine(ea, load.p, load.q, xs)` with
`load` from the preset's `inputs` — so the first painted frame is already coherent with the seed. The
seed shape stays `Partial<SimState>`: every field optional, a preset overrides only what it cares about.
- *Alternative — require a full `SimState`*: rejected; forces presets to restate fields they don't
  care about and duplicates the derivation logic.
- *Alternative — merge the seed over a default-computed state and skip re-solving*: rejected. It leaves
  `lastValidOutputs` solved from `DEFAULT_INPUTS` (zero field, zero load), so a warm preset paints cold
  for one rAF frame — a visible needle-snap from zero on the Vt/P gauges — and a preset that changes
  load never reflects it on the first frame. Deriving the solve from the seeded state costs only passing
  `inputs` in (needed anyway for load) and removes the transient entirely.

**`spinning-dark` (empty seed, default inputs) reproduces today's boot exactly** — the no-op-refactor
regression anchor. Today's machine boots *spinning but dark*: shaft pre-spun to ~1495 rpm
(`valveActual ≈ 93.4 %`, `speedLagged ≈ 0.9967`), zero field, no load. **`cold-dark` is therefore NOT a
reproduction of today's boot** — it carries an explicit at-rest seed (`speedLagged: 0`, `valveActual: 0`,
`valvePct: 0`, `valveCommand: 0`) and is a *deliberate change* to the boot state (the natural Phase 3a
run-up start).

**`BOOT_PRESET` const sets the compile-time default.**
`src/core/presets.ts` exports `BOOT_PRESET: PresetName` (ships `'cold-dark'`) — the single line a
developer flips to change where every reload starts, no URL needed. Resolution order at startup: a valid
`?start=<name>` wins; otherwise fall back to `BOOT_PRESET`; an unknown name also falls back to
`BOOT_PRESET`. The const sets the floor, the URL param overrides it. This turns "which preset is default"
into a one-liner rather than a hard commitment.

**Registry lives in a new `src/core/presets.ts`, keyed by name.**
Each entry is `{ inputs: Partial<Inputs>, seed: Partial<SimState> }`. A `resolvePreset(name?: string)`
helper returns the named preset or `BOOT_PRESET` for unknown/missing names. Keeps preset data out of
`simulation.ts` (which stays pure physics) and out of the hook (which stays wiring).

**URL parsing happens in `App.tsx`, the preset name is passed into the hook.**
`App` reads `?start=` from `window.location.search` once and passes the resolved preset (or its name)
to `useGeneratorSimulation`. The hook stays free of DOM/`window` coupling and remains unit-testable by
passing a preset directly.
- *Alternative — parse inside the hook*: rejected; couples the hook to `window` and complicates tests.

**The hook calls `initialState(preset.inputs, preset.seed)` once.**
Today's hook makes two independent `initialState()` calls — one for the `outputs` state and one for the
`stateRef` (`useGeneratorSimulation.ts:22,25`). With presets it must seed both from a single call so the
two views never diverge.

**`spinning-dark` and `live-loaded` are the two non-default presets.**
`spinning-dark` reproduces today's literal boot — empty seed, default inputs (zero field, valve ≈ 93 %,
near-synchronous speed, no load). `live-loaded` seeds a genuinely warm operating point — field built up
(≈ rated), valve ≈ 93 %, near-synchronous speed, **and** some active load — captured as explicit
`inputs` + `seed` so it boots already at a live point rather than dark.

## Risks / Trade-offs

- **`Partial<SimState>` lets a preset seed an inconsistent state (e.g. high speed, zero field)** →
  Mitigation: presets are code-defined and reviewed; the two initial presets are physically settled.
  No runtime validation added (non-goal: no new physics).
- **URL parsing drift / unknown values** → Mitigation: `resolvePreset` falls back to `BOOT_PRESET` for
  any missing or unrecognised name; covered by a spec scenario and a unit test.
- **`cold-dark` default changes the out-of-box boot** (today is pre-spun) → Accepted: it is the intended
  long-term vanilla and Phase 3a's run-up start. If the pre-spun first impression matters before Phase 3a
  lands, flip `BOOT_PRESET` to `spinning-dark` — a one-line change, no other rework.
- **Future Phase 3/4 coupling** → the mechanism is intentionally minimal so later phases add registry
  entries without touching the seed/resolve contract.
