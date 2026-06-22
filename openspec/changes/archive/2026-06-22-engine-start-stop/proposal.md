## Why

The current UI has two governor speed-changers (fine + coarse), both `SpringLoadedSelector` controls.
The coarse changer is an awkward control for what is really a one-time startup action — the operator
holds it to slew from 0 rpm up toward rated, which is not how a diesel generator actually works. On a
real machine the operator presses **START** and the engine cranks itself up to idle speed autonomously;
**STOP** trips the load and shuts the engine down. Replacing the coarse speed-changer with START/STOP
buttons makes the cold-start sequence tactile, realistic, and frees the operator to focus on the fine
speed-changer for the trim work that actually matters educationally.

## What Changes

- **START button (new control).** Pressing START ramps the throttle to an idle position (~1400 rpm,
  just below the load-breaker arming threshold of ~1425 rpm). The ramp uses the existing governor
  valve-slew machinery so `TAU_VALVE` and the rate limiter still apply — no new physics. The operator
  then uses the **fine speed-changer** to trim up to breaker-armed speed.
- **STOP button (new control).** Pressing STOP (a) opens the load breaker immediately if it is closed,
  then (b) ramps the throttle to 0, coasting the engine to rest. The blackout caused by the breaker
  trip is the honest consequence of stopping the running generator.
- **Coarse `SpringLoadedSelector` removed.** The col-6 layout slot (row 3, currently `COARSE` +
  `GOVERNOR SelectorSwitch`) is reorganised to fit START/STOP in place of the coarse selector, keeping
  the GOVERNOR switch.
- **Fine speed-changer retained.** Once the engine is at idle the operator trims with the fine
  speed-changer exactly as before.
- **No physics changes.** The swing equation, governor, AVR, and all time constants are unchanged.

## Capabilities

### New Capabilities
- `engine-start-stop`: START ramps throttle to idle target (~1400 rpm) autonomously; STOP opens the
  breaker then ramps throttle to 0. Defines the idle-rpm target constant, the ramp behaviour, and the
  button enable/disable rules (START disabled when engine already running; STOP disabled when engine
  already stopped).

### Modified Capabilities
- `simulator-ui`: removes the coarse `SpringLoadedSelector`; adds START and STOP buttons in the
  col-6 slot alongside the GOVERNOR `SelectorSwitch`; fine speed-changer and governor switch retained.
- `simulation-core`: `Inputs` gains an `engineCommand: 'start' | 'stop' | null` field (momentary
  pulse); `useGeneratorSimulation` converts START/STOP presses into throttle ramp targets.

## Impact

- **Core:** `src/core/types.ts` (`Inputs` engine command field), `src/core/constants.ts` (idle-rpm
  target constant).
- **Hook:** `useGeneratorSimulation.ts` — handle `engineCommand`, drive throttle toward idle or 0,
  trigger breaker open on STOP.
- **UI:** `src/App.tsx` — replace coarse `SpringLoadedSelector` with START/STOP buttons;
  `src/styles/` — button styles matching panel aesthetic.
- **Docs:** `docs/roadmap.md` — record the coarse speed-changer removal and START/STOP addition;
  update the User Inputs table and layout diagram.
- **Tests:** new cases for START ramp-to-idle and STOP breaker-trip-then-ramp-to-zero sequences.
