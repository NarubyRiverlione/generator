# Phase 4a — Second Generator: Design Decisions

Decisions settled in brainstorming. Open points are noted inline.

---

## 1. Simulation Architecture

**Two independent simulation instances, single shared tick.**

`step()` is called on both instances sequentially inside one `useEffect` interval, advancing both at the same `dt`. This keeps phase angles comparable when the synchroscope arrives in 4b, without requiring coupled physics in 4a (the machines are not yet electrically connected).

Coupling (shared bus, power exchange) is introduced in 4b/4c as a bridge between the two instances — not baked into the architecture now.

---

## 2. UI Layout

**Read-only status strip + tabs.**

- **Status strip** (always visible): compact side-by-side summary of both generators — RPM, Hz, Vₜ, P, breaker state, AVR/governor armed indicators. Read-only — no controls.
- **Tab bar**: GEN 1 / GEN 2 — switches which full current panel is rendered.
- Both simulations run continuously regardless of which tab is active.

**Fields:** RPM, Hz, Vₜ (V), P (kW), breaker state, AVR armed, governor armed.

**Layout:** ~160 px wide. Two columns (Gen 1 | Gen 2) with a shared label column on the right. Read-only numeric values, indicator dots for breaker/AVR/governor state.

---

## 3. Generator Symmetry

**Both generators are identical — no hard role distinction.**

Neither Gen 1 nor Gen 2 is permanently designated as reference or incoming unit. Both get the same full panel, the same controls, the same presets, and the same startup sequence. Which one acts as the running reference is an operational choice, not a design constraint.

---

## 4. Startup Sequence & Idle State

**START button → idle at 1400 rpm → manual nudge to 1500 rpm.**

Current gap: there is no automated startup command. The operator must manually jog the speed-changer from 0 rpm all the way to operating speed.

Addition for 4a: a **START button** that runs an idle controller — same PI structure as the main governor, targeting ~1400 rpm — until the machine reaches idle. At that point the idle controller hands off and the operator takes over.

1400 rpm is chosen because:
- AVR is already armed at that speed (arm threshold: ~1200 rpm / 0.8 pu)
- The operator only needs a short manual nudge (~100 rpm) to reach the governor arm threshold (~1500 rpm)
- The gap is small and deliberate — matches real diesel generator startup feel

The full cold-start sequence:

```
START button pressed
  → Idle controller spins machine to ~1400 rpm
IDLE
  → AVR can be enabled; operator builds voltage
  → Operator jogs speed-changer manually
~1500 rpm
  → Governor can be enabled; full auto available
  → Load breaker armed (already at > ~1425 rpm)
RUNNING
```

---

## 5. Generator State Machine

Three states gate which controls are available:

| State | Entry condition | Available controls |
|---|---|---|
| STOPPED | Initial / after shutdown | START button only |
| IDLE | Idle controller reached ~1400 rpm | AVR, speed-changer (manual) |
| RUNNING | Operator advanced to ~1500 rpm | Everything incl. governor, load breaker |

Governor arm threshold (~1500 rpm) and load breaker arm threshold (~1425 rpm) are already implemented — the state machine formalises what is already implicitly gated.

---

## 6. Tab Bar

Click to switch GEN 1 / GEN 2. Keyboard shortcuts `1` / `2` included (trivial effort, single `keydown` listener).

---

## 7. Presets

Gen 2 always boots in STOPPED regardless of which `?start=` preset Gen 1 uses. No new two-gen presets needed.

---

## 8. Shutdown

**STOP button** included in Phase 4a. Behaviour:

- Force-trips the load breaker if closed
- Sets valve to 0 %
- Machine coasts to 0 rpm via swing equation + windage
- State returns to STOPPED
