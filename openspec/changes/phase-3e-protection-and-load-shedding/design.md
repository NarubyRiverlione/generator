## Context

The existing ANSI-27 relay (under-voltage trip) lives entirely in `useGeneratorSimulation.ts` as a
set of `useRef` values — pickup armed flag, latch flag, and a React state mirror for the UI. The hook
monitors `result.outputs.vt` each tick and acts on it: no pickup timer (27 trips instantly once armed),
no changes to `SimState` or `simulation.ts`. This pattern works well and should be the template for
both new relays.

The 59 and 81 differ from 27 in two ways: both need **pickup timers** (100 ms and 500 ms respectively),
and their trip actions are different (field zero-out vs. load-fraction step-down). Everything else
follows the same ref/latch structure.

---

## Goals / Non-Goals

**Goals:**
- ANSI-59 overvoltage relay: trips the field (and AVR) when Vt exceeds 1.15 pu for ≥ 100 ms; latches; manual reset.
- ANSI-81 under-frequency relay: sheds 25% of rated load when Hz < 48.5 Hz for ≥ 500 ms; self-resetting; repeatable; stops shedding when loadFraction hits 0.
- Relay state visible via indicator LED (59) and LCD tile (81 shed count).
- ANSI-59 reset button added to the col-4 row-3 cell alongside the existing 27 dome.

**Non-Goals:**
- ANSI-59 is not an overspeed relay — it trips on voltage, not RPM. (Overspeed protection is
  a future item.)
- ANSI-81 does not shed in priority order (HVAC first, then galley, etc.) — all load is shed
  as a single undifferentiated block per trigger.
- No inter-relay coordination logic — if 59 and 27 both trip, the UI shows the highest-priority
  fault screen message; both latch independently.

---

## Decisions

### 1. Pickup timers stay in the hook, not in SimState

**Decision:** accumulate pickup time with `useRef<number>` in the hook, same tick loop that already
reads `result.outputs`.

**Rationale:** the existing 27 relay is hook-only, and the new relays only add timers — not new physics.
Moving pickup state into `SimState` would require `simulation.ts` to know about protection relay
configuration (thresholds, timers), which mixes protection logic into the physics solver. The hook is
the right home for "watch outputs, take side effects" logic.

**Alternative considered:** put timers in `SimState` so they're serializable and unit-testable in
isolation. Rejected: the sim already has no relay knowledge; adding it would be a heavier coupling
change with no teaching benefit.

### 2. ANSI-59 trip: zero the field AND turn off AVR

**Decision:** when the 59 pickup completes, the hook does:
```
inputsRef.current = { ...inputsRef.current, avrOn: false, fieldVoltage: 0 }
setInputs(...)
relay59Ref.current = true
setRelay59Tripped(true)
```

**Rationale:** when AVR is on, `inputs.fieldVoltage` is ignored — the AVR drives the field target
directly in `simulation.ts`. A field trip must cut the exciter command, which means turning off the
AVR. Real practice: the 59 trips the field contactor, which physically removes AVR authority. Setting
`avrOn: false` + `fieldVoltage: 0` achieves the same effect and gives the operator a visible AVR-off
state after the trip.

**Reset:** the user clicks the 59 dome → `relay59Ref.current = false`, `relay59Tripped` cleared.
Field stays at 0 and AVR stays off until the operator manually re-engages — the machine will not
self-excite on reset.

### 3. ANSI-81 trip: step down loadFraction, then reset pickup

**Decision:** each time the 81 pickup completes:
1. Clamp: `newLoad = Math.max(0, loadFraction - RELAY81_SHED_FRACTION)`
2. Apply: `inputsRef.current = { ...inputsRef.current, loadFraction: newLoad }; setInputs(...)`
3. Increment: `relay81ShedCountRef.current += 1`
4. Reset pickup timer to 0 — relay is immediately available to fire again if Hz is still below threshold.

**Rationale:** the repeatable model is more realistic (the LMS sheds non-critical consumers in
rounds until frequency recovers) and more instructive (the operator sees Hz recover a little after
each shed, or not at all if the machine is already too far gone). The floor at 0 prevents negative
load.

**No latch:** 81 is not a latching relay. It fires, sheds, and is immediately armed again. Shed count
is surfaced on the LCD as an event counter — it resets when the operator resets the simulation or
starts fresh. There is no 81 reset button.

### 4. ANSI-59 reset lives alongside the 27 dome in col-4 row-3

**Decision:** the existing `relay27-section` div in `App.tsx` grows to show two domes (27 on top, 59
below), each with its own label. The 59 dome is only lit/pressable when `relay59Tripped`.

**Rationale:** the relay reset column is already established — adding a second dome there is
immediately legible. An alternative of using an `IlluminatedButton` for 59 reset was considered but
rejected — the dome pattern is specifically for relay resets (momentary, event-driven), while
`IlluminatedButton` is for operator-chosen modes.

### 5. Indicator lights: replace "Q SUPPLYING" with "59 RELAY TRIP"

**Decision:** the bottom indicator block currently shows: 27 RELAY TRIP / GOV ACTIVE / VALVE AT
CEILING / Q SUPPLYING. Replace Q SUPPLYING with 59 RELAY TRIP (red when tripped). Q SUPPLYING is
already readable from the LCD (Q tile) and from the load angle — the indicator is redundant.

**ANSI-81 gets no LED:** it is not a latching fault — it is an automatic action. The LCD tile (shed
count + threshold annotation) is sufficient.

### 6. Fault screen priority: 59 > 27 > danger > warn > 81 shed > ok

**Decision:** extend `faultLevel()` in `StatusDisplay.tsx` to:
```
relay59Tripped → 'fault59'   (new level, highest priority)
relay27Tripped → 'fault27'   (existing 'fault' renamed for clarity)
stabilityMargin < 0.08 → 'danger'
stabilityMargin < 0.2 → 'warn'
relay81ShedCount > 0 && level === 'ok' → 'shed'   (advisory, lowest priority)
```
The fault screen renders the appropriate message for the active level.

### 7. 59 threshold: 1.15 pu (460 V) with 100 ms pickup

**Rationale:** 115% rated is a standard overvoltage protection setpoint for LV marine switchboards.
The 100 ms pickup is long enough to avoid nuisance trips on fast transients (e.g. governor hunting
causing momentary voltage blips) but short enough to catch the load rejection spike before it stresses
insulation.

### 8. 81 threshold: 48.5 Hz (0.970 pu) with 500 ms pickup; shed step 25% of rated

**Rationale:** 48.5 Hz is a common first-stage under-frequency load shed setpoint for isolated LV
grids. The 500 ms pickup matches real LMS response time. 25% per stage means 4 stages to shed a
fully loaded machine — the operator has time to observe the sequence without it being instantaneous.

---

## Risks / Trade-offs

- **81 fires during governor recovery transient**: if the governor is slow to restore frequency after
  a load step, the 81 may shed load before the governor has had a chance to recover — potentially
  shedding load that wasn't necessary. Mitigation: the 500 ms pickup (≈ 1.7 × τ_valve) gives the
  governor one full valve-response cycle before the relay fires. The educational moment: why governor
  response speed matters.

- **59 won't fire during normal operation**: with TAU_VALVE = 0.3 s and H = 4 s, a load rejection
  does spike Vt — but only to ~1.05–1.10 pu with the AVR off, because the field current can't change
  instantaneously. The 59 fires most visibly if the operator loads the AVR to near-ceiling and then
  opens the breaker. This is fine — it's the instructive scenario.

- **Both domes in col-4 row-3**: this cell will now carry two relay domes + labels. The cell is
  138 px wide — enough for a stacked layout. If it feels cramped, the 59 dome can be styled smaller
  than the 27 dome (secondary vs. primary protection).

---

## Open Questions

None — scope is clear and thresholds are fixed. Implementation can begin.
