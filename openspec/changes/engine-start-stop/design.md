## Context

The simulation already has the full swing equation, governor, damper windings, and load breaker
(Stages 3a–3d). The coarse `SpringLoadedSelector` currently slews the throttle in large steps
(10 / 25 rpm/s slow/fast). It is used almost exclusively during startup to bring the shaft from
rest to near-synchronous speed — a task that on a real diesel generator is done by the engine's
own cranking/auto-idle logic, not by an operator holding a switch.

The fine `SpringLoadedSelector` remains useful: it is the precision tool for trimming speed before
closing the load breaker and during manual governor-off operation. The coarse control has no distinct
educational value once START/STOP replace the startup/shutdown ceremony.

The `IDLE_RPM` target (~1400 rpm) is deliberately below the load-breaker arming threshold (~1425 rpm,
0.95 pu). This forces the operator to use the fine speed-changer to reach arming speed — preserving
the teaching moment about the interlock while removing the tedium of the full run-up.

## Goals / Non-Goals

**Goals:**
- Replace coarse `SpringLoadedSelector` with START and STOP buttons
- START ramps throttle to idle target autonomously using existing slew/lag machinery
- STOP opens the load breaker then ramps throttle to 0
- Fine speed-changer and governor switch are untouched
- No physics model changes

**Non-Goals:**
- Automated run-up to rated speed (1500 rpm) — idle is the target, trim is manual
- Engine cranking animation or startup delay (cold-dark → spinning is already instant throttle ramp)
- Soft load transfer on STOP — the breaker trips hard, blackout is the honest result
- Modifying AVR, governor, or swing-equation parameters

## Decisions

### 1 — Idle target as a named constant (`IDLE_RPM = 1400`)

`IDLE_RPM` lives in `constants.ts` alongside `RATED_RPM`. The hook converts it to a throttle position
using the existing `rpmToValve()` mapping. This keeps the idle target visible and adjustable without
touching hook logic.

**Alternative considered:** hard-code 1400 rpm inline in the hook. Rejected — a magic number for a
teaching target belongs in constants.

### 2 — START/STOP as momentary `engineCommand` on `Inputs`

`Inputs` gains `engineCommand: 'start' | 'stop' | null`. The hook acts on the pulse and clears it
the same tick — it does not hold state in `Inputs`. The actual ramp state (whether an auto-start is
in progress) lives in the hook's `useRef`, not in simulation state. The physics layer (`step()`) is
unchanged.

**Alternative considered:** Boolean `isRunning` flag on `Inputs`. Rejected — `isRunning` is a derived
condition (ω > threshold), not a user input, so encoding it as an input creates redundancy.

### 3 — STOP sequence: breaker open first, then throttle ramp to 0

On STOP the hook immediately dispatches `loadBreaker: false` (same path as the manual breaker open),
then sets the throttle ramp target to 0. The breaker trip is instantaneous; the throttle ramp follows
at the existing governor rate-limiter speed. This sequence matches real plant practice (shed load
before killing fuel) and ensures the swing equation sees no Pe spike on the way down.

**Alternative considered:** ramp throttle to 0 first, let natural slowdown open the breaker via the
underspeed lockout. Rejected — the lockout is a *protection* interlock, not an orderly shutdown path;
it would also leave load connected during the ramp, creating a frequency-collapse scenario that is a
distraction from the shutdown teaching.

### 4 — Button enable rules

| Button | Enabled when |
|--------|-------------|
| START  | `omega < IDLE_RPM threshold` (engine not already at/above idle) |
| STOP   | `omega > near-zero threshold` (engine actually running) |

The thresholds use rpm, not the `engineCommand` field, so button state reflects physical reality rather
than command state. Both buttons disabled during an active ramp (START disabled once ramp begins, STOP
always available to cancel a start ramp — STOP wins).

**Alternative considered:** track a separate `autoRampActive` flag for disabling START mid-ramp.
Accepted — the `useRef` ramp state is sufficient; START simply checks `omega >= IDLE_OMEGA * 0.98`
to determine if idle has been reached.

### 5 — Layout: col-6 row-3 reorganised

Current col-6, row 3 contains `COARSE SpringLoadedSelector` (top) and `GOVERNOR SelectorSwitch`
(bottom). After this change: START button (top), STOP button (middle), GOVERNOR SelectorSwitch
(bottom). The fine speed-changer stays in col-6 row 2.

The coarse `SpringLoadedSelector` component itself is **retained in the codebase** (symmetrical with
`PositionIndicator` retention policy) but not rendered.

### 6 — Throttle ramp rate during auto-start

START uses the existing governor rate limiter (`GOV_RATE_LIMIT = 10 %/s`) applied to the throttle
directly — the same slew the governor uses. This means START is not artificially fast; the operator
watches the shaft accelerate at a physically realistic rate. No new rate constant is introduced.

## Risks / Trade-offs

- **Cold-dark preset now requires pressing START.** Previously the operator could immediately grab the
  coarse speed-changer. Now they press START and wait for idle. This is more realistic but changes the
  entry experience.
  → Document clearly in the preset description; intentional improvement.

- **STOP during governor-on.** If the governor is running and STOP is pressed, the governor will fight
  the throttle ramp-to-zero. The hook should disable the governor (set `governorOn: false`) as part of
  the STOP sequence before ramping the throttle.
  → Add governor-off step to STOP handler; no new physics needed.

- **Fine speed-changer at 0 rpm.** With the coarse control gone, the fine speed-changer is the only
  manual throttle during governor-off operation. Its rate (0.5 / 5 rpm/s) is adequate for trim but
  very slow for recovery from near-zero. START is the correct answer for run-up; document this.
  → No code mitigation; add LCD hint or tooltip if needed in a later polish pass.
