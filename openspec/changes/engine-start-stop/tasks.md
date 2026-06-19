## 1. Core types and constants

- [ ] 1.1 Add `engineCommand: 'start' | 'stop' | null` to `Inputs` in `src/core/types.ts`
- [ ] 1.2 Add `IDLE_RPM: 1400` to `src/core/constants.ts` (and derive `IDLE_OMEGA = IDLE_RPM / RPM_RATED * OMEGA_REF`)

## 2. Simulation hook — engine command handling

- [ ] 2.1 In `src/hooks/useGeneratorSimulation.ts`: add a `useRef` to track auto-ramp target (`null | 'idle' | 'zero'`)
- [ ] 2.2 On `engineCommand === 'start'`: set ramp target to `'idle'`; drive throttle toward `IDLE_OMEGA` valve position each tick using the existing governor rate limiter (`GOV_RATE_LIMIT`)
- [ ] 2.3 On `engineCommand === 'stop'`: (a) set `loadBreaker: false` immediately, (b) set `governorOn: false` immediately, (c) set ramp target to `'zero'`; drive throttle toward 0 each tick
- [ ] 2.4 Clear `engineCommand` (set to `null`) after reading it each tick — it is a momentary pulse
- [ ] 2.5 Clear the ramp target when the throttle reaches its destination (within a small epsilon)
- [ ] 2.6 Expose `startEngine()` and `stopEngine()` from the hook (set `engineCommand` accordingly)

## 3. UI — START / STOP buttons

- [ ] 3.1 Create START and STOP button elements in `App.tsx` (or a small wrapper component); style as panel pushbuttons matching the existing `LoadBreaker` aesthetic
- [ ] 3.2 START disabled when `omega >= IDLE_OMEGA * 0.98` (engine already at or above idle)
- [ ] 3.3 STOP disabled when `omega < near-zero threshold` (engine already stopped, e.g. `omega < 0.02 * OMEGA_REF`)
- [ ] 3.4 Wire `startEngine()` and `stopEngine()` from the hook to the buttons

## 4. Panel layout — replace coarse speed-changer

- [ ] 4.1 In `App.tsx`: remove the coarse `SpringLoadedSelector` JSX from the col-6 row-3 slot
- [ ] 4.2 Place START button, STOP button, and GOVERNOR `SelectorSwitch` in col-6 row-3 (stacked: START top, STOP middle, GOVERNOR bottom)
- [ ] 4.3 Keep the coarse `SpringLoadedSelector` component file intact (do not delete); remove the import from `App.tsx` only if unused elsewhere
- [ ] 4.4 Verify the 6-column grid renders correctly and fine speed-changer (col-6 row-2) is unaffected

## 5. Hook — coarse speed-changer wiring removal

- [ ] 5.1 Remove `coarseSpeedChanger` state and its setter from `useGeneratorSimulation.ts`
- [ ] 5.2 Remove the coarse jog logic from the hook's per-tick update (fine jog logic is untouched)
- [ ] 5.3 Confirm `Inputs` no longer receives a coarse speed-changer value (or zero it out if the field must remain for type compatibility — prefer removing the field entirely)

## 6. Tests

- [ ] 6.1 Add a unit test: `startEngine()` → throttle ramps toward `IDLE_OMEGA` valve position over multiple ticks; reaches idle within expected time
- [ ] 6.2 Add a unit test: `stopEngine()` with breaker closed → breaker opens on the first tick, throttle ramps to 0
- [ ] 6.3 Add a unit test: `stopEngine()` with governor on → governor is disabled on the first tick
- [ ] 6.4 Add a unit test: START button disabled when `omega >= IDLE_OMEGA * 0.98`
- [ ] 6.5 Add a unit test: STOP button disabled when `omega < 0.02 * OMEGA_REF`

## 7. Docs update (on archive)

- [ ] 7.1 In `docs/roadmap.md` User Inputs table: replace the coarse `SpringLoadedSelector` row with START and STOP button rows
- [ ] 7.2 Update the layout diagram: col-6 row-3 shows `START / STOP / GOVERNOR` instead of `COARSE / GOVERNOR`
- [ ] 7.3 Update the Fixed Parameters table: note `IDLE_RPM = 1400` under Rotor / governor
- [ ] 7.4 Add a note to the `PositionIndicator` naming.md entry policy (or a comment in code) that `SpringLoadedSelector` (coarse) is similarly retained but unmounted
