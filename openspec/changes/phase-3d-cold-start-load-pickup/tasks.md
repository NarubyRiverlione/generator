## 1. Core types and constants

- [x] 1.1 Add `loadBreaker: boolean` (default `false`) to `Inputs` in `src/core/types.ts`
- [x] 1.2 Add `dampingTorque: number` to `Outputs` in `src/core/types.ts`
- [x] 1.3 Change `TAU_VALVE` from `2.0` to `0.3` in `src/core/constants.ts`
- [x] 1.4 Add `loadBreaker: false` to `DEFAULT_INPUTS` in `src/core/constants.ts`

## 2. Simulation step — breaker gating and damping torque

- [x] 2.1 In `src/core/simulation.ts` `step()`: gate the load demand — when `inputs.loadBreaker` is `false`, pass `{ p: 0, q: 0 }` to `solveMachine()` instead of the Knob-derived load
- [x] 2.2 In `step()`: compute `dampingTorque = DAMPING_D * (state.omega - OMEGA_REF)` and include it in the returned `Outputs`
- [x] 2.3 In `initialState()`: include `dampingTorque: 0` in `lastValidOutputs` to keep the initial state coherent

## 3. Presets

- [x] 3.1 Add `loadBreaker: false` to all three presets in `src/core/presets.ts` (`cold-dark`, `spinning-dark`, `live-loaded`)

## 4. Simulation hook

- [x] 4.1 In `src/hooks/useGeneratorSimulation.ts`: wire `loadBreaker` from component state through to `Inputs` passed to `step()`
- [x] 4.2 Expose a `setLoadBreaker` setter (or equivalent toggle) from the hook for the UI to call

## 5. Load breaker UI control

- [x] 5.1 Create the load breaker control component (button/toggle styled as panel switchgear, not a `SelectorSwitch`); displays OPEN / CLOSED state
- [x] 5.2 Implement the 0.95 pu arming interlock: disable the control and dim it visually when `outputs.rpm < 0.95 * RPM_RATED` (≈ 1425 rpm)
- [x] 5.3 Wire the control into `App.tsx` — place it in the panel grid (row 3, col 5 area near the active-load Knob is natural; confirm against the layout)

## 6. Panel layout — remove PositionIndicator

- [x] 6.1 In `App.tsx`: remove the `PositionIndicator` JSX element from the row-1 / col-6 grid slot
- [x] 6.2 Keep the `PositionIndicator` import and component file intact (do not delete)
- [x] 6.3 Verify the 6-column grid still renders correctly without that slot (no layout shift)

## 7. StatusDisplay LCD tiles

- [x] 7.1 In `StatusDisplay` (or wherever LCD tiles are defined): add a **throttle %** tile showing `outputs.valveActual` formatted as `XX.X %`
- [x] 7.2 Add a **damping torque** tile showing `outputs.dampingTorque` formatted as `+X.XXX pu` (sign always shown)
- [x] 7.3 Update the LCD legend to describe throttle % and damping torque (alongside existing SAT and ΔP entries)

## 8. Tests

- [x] 8.1 Add a unit test: breaker open → `solveMachine` receives zero load regardless of Knob; `Vt` settles to `Ea`
- [x] 8.2 Add a unit test: breaker close → `Pe` jumps to full Knob value in the next step (no ramp)
- [x] 8.3 Add a unit test: `dampingTorque` is 0 when `omega = OMEGA_REF`; non-zero proportional to slip when `omega ≠ OMEGA_REF`
- [x] 8.4 Update any existing tests that assert `TAU_VALVE = 2.0` or depend on the old valve-lag recovery time
- [x] 8.5 Add a snapshot or render test confirming `PositionIndicator` is not present in the panel DOM
- [x] 8.6 Add a test confirming the breaker control is disabled when `rpm < 1425`

## 9. Docs update (on archive)

- [x] 9.1 Mark Stage 3d ✓ complete in `docs/roadmap.md`
- [x] 9.2 Update `TAU_VALVE` in the Fixed Parameters table to `0.3 s` with the diesel-throttle note
- [x] 9.3 Update the layout diagram to remove `PositionIndicator` from row 1 / col 6 and note the load-breaker placement
- [x] 9.4 Update the Footer entry from `PHASE 3B` to `PHASE 3D` in `App.tsx` and `docs/roadmap.md`
- [x] 9.5 Add `dampingTorque` to the Outputs section of the roadmap
