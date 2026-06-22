## 1. Core types and constants

- [x] 1.1 Add `engineCommand: 'start' | 'stop' | null` to `Inputs` in `src/core/types.ts`
- [x] 1.2 Add `IDLE_RPM: 1400` to `src/core/constants.ts` (and derive `IDLE_VALVE_PCT = IDLE_RPM / VALVE_RPM_MAX * 100`)

## 2. Simulation hook — engine command handling

- [x] 2.1 In `src/hooks/useGeneratorSimulation.ts`: add a `useRef` to track auto-ramp target (`null | number`)
- [x] 2.2 On `engineCommand === 'start'`: set ramp target to `IDLE_VALVE_PCT`; drive throttle toward it each tick using `GOV_RATE_LIMIT`
- [x] 2.3 On `engineCommand === 'stop'`: (a) set `loadBreaker: false` immediately, (b) set `governorOn: false` immediately, (c) set ramp target to `0`; drive throttle toward 0 each tick
- [x] 2.4 Clear `engineCommand` (set to `null`) after reading it each tick — it is a momentary pulse
- [x] 2.5 Clear the ramp target when the throttle reaches its destination (within a small epsilon)
- [x] 2.6 Expose `startEngine()` and `stopEngine()` from the hook (set `engineCommand` accordingly)

## 3. UI — START / STOP buttons

- [x] 3.1 Create START and STOP button elements in `App.tsx`; style as square panel pushbuttons with IEC symbols (I / O)
- [x] 3.2 START disabled when `rpm >= 1380` (engine already at or above idle)
- [x] 3.3 STOP disabled when `rpm < 30` (engine already stopped)
- [x] 3.4 Wire `startEngine()` and `stopEngine()` from the hook to the buttons

## 4. Panel layout — replace coarse speed-changer

- [x] 4.1 In `App.tsx`: remove the coarse `SpringLoadedSelector` JSX from the col-6 row-3 slot
- [x] 4.2 Place START button, STOP button, and GOVERNOR `SelectorSwitch` in col-6 row-3 (ENGINE header + button row on top, GOVERNOR below)
- [x] 4.3 Keep the coarse `SpringLoadedSelector` component file intact (do not delete); import no longer in `App.tsx`
- [x] 4.4 Verify the 6-column grid renders correctly and fine speed-changer (col-6 row-2) is unaffected

## 5. Hook — coarse speed-changer wiring removal

- [x] 5.1 Remove `coarseSpeedChanger` state and its setter from `useGeneratorSimulation.ts`
- [x] 5.2 Remove the coarse jog logic from `simulation.ts` (`coarseJogRate` function + import of `JOG_COARSE_*`)
- [x] 5.3 Remove `coarseValveCommand` from `Inputs` type and `DEFAULT_INPUTS`

## 6. Tests

- [x] 6.1 Valve ramp mechanics: each tick advances at most `GOV_RATE_LIMIT * dt` toward target
- [x] 6.2 Stop sequence: Pe drops to 0 in the first step after breaker opens
- [x] 6.3 Stop sequence: governor off — valve is no longer PI-driven
- [x] 6.4 Valve reaches 0 after ramp completes (~IDLE_VALVE_PCT / GOV_RATE_LIMIT seconds)
- [x] 6.5 Pm drops to 0 when valve reaches 0 (mechanical power cut confirmed)

## 7. Docs update (on archive)

- [x] 7.1 In `docs/roadmap.md` User Inputs table: replace the coarse `SpringLoadedSelector` row with START and STOP button rows
- [x] 7.2 Update the layout diagram: col-6 row-3 shows `START / STOP / GOVERNOR` instead of `COARSE / GOVERNOR`
- [x] 7.3 Update the Fixed Parameters table: note `IDLE_RPM = 1400` and `IDLE_VALVE_PCT = 87.5 %` under Rotor / governor
- [x] 7.4 Add a note about `SpringLoadedSelector` (coarse) retained but unmounted — same policy as `PositionIndicator`
