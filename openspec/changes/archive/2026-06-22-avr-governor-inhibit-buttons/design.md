## Context

Both the AVR and Governor are currently `SelectorSwitch` controls — they show on/off position but
give no signal about readiness. The AVR has a single arm threshold (`OMEGA_AVR_ENABLE = 0.80 pu`)
that gates it inside `step()`, but there is no equivalent gate for the governor. Neither control has
hysteresis or any UI feedback for the inhibited state.

The startup sequence post-`engine-start-stop` is:
1. Press START → throttle ramps to idle (1400 rpm / 0.933 pu)
2. Operator raises field, AVR arms and holds Vt
3. Operator engages governor → trims to 1500 rpm
4. Operator closes load breaker

The governor inhibit should arm exactly at idle — the point where START hands off to the operator.
Enabling the governor earlier causes integral windup: the error `(1.0 − ω)` can be large for
tens of seconds, and the accumulated integral forces the valve to 100% for a long time after rated
speed is reached.

## Goals / Non-Goals

**Goals:**
- New `IlluminatedButton` component with 3-state backlight (amber / dark / green)
- Governor underspeed inhibit, armed at idle speed, with hysteresis disarm
- AVR disarm hysteresis (arm threshold unchanged)
- Both regulators use `IlluminatedButton` instead of `SelectorSwitch`
- Hysteresis state in `SimState` (physics-layer, self-contained, testable)

**Non-Goals:**
- Changing AVR or governor gains, rate limits, or any other physics parameter
- Adding "AVR INHIBITED" / "GOV INHIBITED" text labels — the button backlight is sufficient
- Inhibiting the governor when the load breaker opens (that is load-rejection, not underspeed)
- Hysteresis on the load-breaker arming interlock (separate concern)

## Decisions

### 1 — Hysteresis state in `SimState`, not the hook

The arm/disarm decision requires knowledge of the previous state ("was I armed last tick?").
`SimState` already holds control-layer state (`avrIntegral`, `governorIntegral`). Adding
`avrArmed: boolean` and `govArmed: boolean` is consistent with that pattern. `step()` remains
fully deterministic given `(state, inputs)` — no side-channels.

**Alternative:** track `useRef` booleans in the hook and pass them into `step()` via `Inputs`.
Rejected — this pollutes `Inputs` with internal control state and makes the hook responsible for
logic that belongs in the physics layer.

### 2 — Inhibit thresholds

| Regulator | Arm | Disarm | Rationale |
|-----------|-----|--------|-----------|
| AVR | 0.80 pu / 1200 rpm | 0.77 pu / 1155 rpm | Existing arm threshold; disarm gap ≈ 45 rpm prevents relay chatter |
| Governor | 0.933 pu / 1400 rpm | 0.90 pu / 1350 rpm | Arm at idle (START hand-off point); disarm gap ≈ 50 rpm |

`OMEGA_GOV_ENABLE = IDLE_RPM / RPM_RATED` — constant derived from existing `IDLE_RPM` so the two
definitions stay in sync.

### 3 — `IlluminatedButton` backlight states

| `inhibited` | `active` | Backlight |
|-------------|----------|-----------|
| true | any | Amber |
| false | false | Dark (off) |
| false | true | Green |

Pressing while `inhibited = true` is a no-op — no toggle, no visual feedback beyond "still amber".
The amber light itself is the feedback: "not yet."

The component does not know the arm/inhibit logic — it receives `inhibited: boolean` as a prop.
`App.tsx` derives this from `outputs.avrArmed` / `outputs.govArmed`.

### 4 — `Outputs` surfaces `avrArmed` and `govArmed`

`step()` writes the updated hysteresis booleans into both `SimState` (next state) and `Outputs`
(current readout). This avoids the App having to reach into `stateRef` and keeps the hook interface
clean — `outputs.avrArmed` is the inhibit signal.

### 5 — `IlluminatedButton` replaces `SelectorSwitch` for AVR and Governor only

`SelectorSwitch` is retained in the codebase and stays mounted for any other uses. The AVR and
Governor slots switch to `IlluminatedButton`. The Power Factor knob, load knob, and field knob are
unaffected.

### 6 — Pressing a latched-on button while speed drops into inhibit

If the AVR is active (green) and the operator pulls the throttle back until speed drops below
`OMEGA_AVR_DISABLE`, the simulation disarms (`avrArmed = false`). The hook should detect this
transition and force `avrOn = false` (i.e., set the input to match reality). Otherwise the button
would show amber while `inputs.avrOn = true`, which is internally inconsistent.

The hook watches `outputs.avrArmed` each tick and clears `avrOn` / `governorOn` when the
corresponding armed signal drops.

### 7 — Component name: `IlluminatedButton`

Follows the noun-describes-the-component pattern of the codebase (`SelectorSwitch`, `LoadBreaker`,
`SpringLoadedSelector`). Avoids `PilotButton` (too aviation-flavoured) or `LampButton` (too
generic). `IlluminatedButton` is self-describing and matches IEC 60947-5-1 terminology for
"pushbutton with integrated indicating light."

## Risks / Trade-offs

- **Force-off on disarm.** Clearing `governorOn` when the governor disarms is a new behaviour with
  no precedent in the codebase. It must happen in the hook tick (not a React event) to avoid a
  one-tick glitch where `step()` sees `governorOn=true` with `govArmed=false`. Implemented as a
  post-step check in the tick loop.

- **Initial state.** At cold-dark boot (`omega ≈ 0.9967 pu`) the governor is above `OMEGA_GOV_ENABLE`
  but below rated. `initialState()` derives the initial armed booleans from the seed omega — both
  regulators boot as armed if speed is above their arm threshold (matching the live-loaded preset).
  Cold-dark boots with governor disarmed is fine — the boot omega is 0.9967 which IS above 0.933,
  so governor boots as armed. The load-breaker arming interlock keeps things safe.

- **`SelectorSwitch` retirement from AVR/Governor slots.** The component is kept in the codebase
  (same policy as `PositionIndicator`). `naming.md` notes the retirement.
