## 1. Seedable initial state (core)

- [ ] 1.1 Change `initialState()` in `src/core/simulation.ts` to `initialState(inputs: Inputs = DEFAULT_INPUTS, seed?: Partial<SimState>)`: take each lagged field (`iField`, `exciterLagged`, `speedLagged`, `valvePct`, `valveActual`) from `seed` when present, else derive it from `inputs`.
- [ ] 1.2 Derive `lastValidOutputs` from the seeded laggeds the same way `step()` does — `ea = saturation(iField) × speedLagged`, `solveMachine(ea, load.p, load.q, xs)` with `load` from `inputs` — so the first painted frame is coherent with the seed (no needle-snap from zero).
- [ ] 1.3 Verify the no-argument path is byte-for-byte equivalent to the previous default (zero field, valve ≈ 93 %, near-synchronous speed) — i.e. the `spinning-dark` operating point, the regression anchor.
- [ ] 1.4 Unit tests: no-seed equals prior default; partial seed overrides only named fields and leaves the rest derived from `inputs`; `lastValidOutputs` is coherent with the seed on the first frame; a seeded settled state advances under `step()` identically to the same state reached by settling.

## 2. Preset registry (core)

- [ ] 2.1 Add `src/core/presets.ts` exporting a `StartPreset = { inputs: Partial<Inputs>; seed: Partial<SimState> }` type, a `PresetName` type, a name-keyed registry, and a `BOOT_PRESET: PresetName` const (ships `'cold-dark'`) naming the compile-time default.
- [ ] 2.2 Define the three presets: `cold-dark` with an explicit at-rest `seed` (`speedLagged: 0`, `valveActual: 0`, `valvePct: 0`, `valveCommand: 0`) — a *deliberate change* from today's boot; `spinning-dark` with an empty `seed` + default inputs so it reproduces `initialState()` exactly (the regression anchor / today's literal boot); and `live-loaded` with `inputs` + settled `seed` (field built up ≈ rated, valve ≈ 93 %, near-synchronous speed, **and** some active load).
- [ ] 2.3 Add `resolvePreset(name?: string)` returning the named preset or `BOOT_PRESET` for missing/unknown names.
- [ ] 2.4 Unit tests: known name resolves to its definition; `undefined` and unknown names fall back to `BOOT_PRESET`; `spinning-dark` produces a state field-for-field equal to no-arg `initialState()`; `cold-dark` produces an at-rest state (speed/valve zero).

## 3. Hook + URL wiring (UI)

- [ ] 3.1 Update `useGeneratorSimulation` (`src/hooks/useGeneratorSimulation.ts`) to accept a resolved preset (or its name) and seed `useState<Inputs>`, the `SimState` ref, `inputsRef`, and `outputs` from it instead of bare `DEFAULT_INPUTS` / `initialState()`. Call `initialState(preset.inputs, preset.seed)` **once** and reuse it for both `outputs` and `stateRef` (replacing today's two independent `initialState()` calls).
- [ ] 3.2 In `src/App.tsx`, read `?start=` from `window.location.search` once at startup, call `resolvePreset`, and pass the result into the hook.
- [ ] 3.3 Confirm no `start` param boots `BOOT_PRESET` (`cold-dark`, at rest), `?start=spinning-dark` reproduces today's pre-spun boot, and `?start=live-loaded` boots already settled at a loaded point (no multi-second lag wait).

## 4. Verification

- [ ] 4.1 Run `pnpm test` (or repo test command) — all new and existing tests green; coverage target met.
- [ ] 4.2 Run lint/format and build; smoke-test `?start=cold-dark` (or no param), `?start=spinning-dark`, and `?start=live-loaded`, plus an unknown value falling back to `BOOT_PRESET`.
