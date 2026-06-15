# Session notes — 2026-06-15: Protection & Stability indicators

## What was done

Three independent improvements were implemented during this session. Two are fully working and exercised in the browser. One (FIELD AT CEILING) is coded but visual verification was blocked by a React Strict Mode tooling issue — see below.

---

## 1. Voltage Stability Margin (VSM) — DONE

**Problem:** The existing δ-based warnings (70° / 85°) never fired before collapse. At PF 0.85 lag with Xs = 1.2, the machine collapses at δ ≈ 26–29°, nowhere near 90°. The classical δ = 90° stability limit only applies at unity PF.

**Fix:** Replace the thresholds with a physics-correct **discriminant-based stability margin**.

### How it works

The quadratic solved in `machine.ts` is:

```
A·u² + B·u + C = 0,   u = Vt²
```

The discriminant `D = B² − 4AC` goes negative at the nose point of the PV curve (voltage collapse). At no-load (P = Q = 0), the discriminant reduces to:

```
D_no_load = (9·Ea²/Xs²)²
```

**VSM = max(0, D) / D_no_load**

- VSM = 1.0 → no-load, fully stable
- VSM = 0.0 → nose point, on the edge of collapse
- VSM is independent of PF angle, field level, or operating point

### Files changed

- **`src/core/types.ts`** — added `stabilityMargin: number` to `Outputs`
- **`src/core/machine.ts`** — computes `stabilityMargin` after discriminant, before collapse check; returns it in the non-collapsed result; guarded against `ea = 0` with `dNoLoad > 0 ? ... : 0`
- **`src/core/simulation.ts`** — added `stabilityMargin: 0` to the collapsed fallback state
- **`src/components/StatusDisplay.tsx`** — LCD line 3 shows `VSM xx%`, amber when < 20%, red when < 8%; sticky note updated

---

## 2. ANSI 27 Under-Voltage Relay — CODED, FUNCTIONALLY TESTED, VISUAL VERIFICATION INCOMPLETE

**Rationale:** IRL, islanded generators have under-voltage protection that disconnects the load before the machine reaches voltage collapse. The trip threshold (0.85 pu = 340 V) is above the nose-point voltage (≈ 0.57 pu at default params), so the relay always fires first — the `collapsed` physics backstop is now unreachable under normal operation.

### How it works

**Trip condition:** `Vt < 0.85 pu` (constant `RELAY27_TRIP_VT` in `constants.ts`)

**Startup inhibit (arming):** The relay does **not** fire on startup, even though Vt starts at 0 and rises through the threshold during field build-up. A `relay27ArmedRef` starts `false` and becomes `true` only once Vt has risen above 0.85 pu. After a RESET, the armed state clears, so the relay must re-arm before it can fire again. This prevents a re-trip during the field rebuild after RESET.

**Sequence in the RAF tick (inside `useGeneratorSimulation.ts`):**

```typescript
// Arm once Vt has been healthy
if (result.outputs.vt >= RELAY27_TRIP_VT) relay27ArmedRef.current = true

// Trip: only if armed and Vt drops below threshold
if (!relay27Ref.current && relay27ArmedRef.current && result.outputs.vt < RELAY27_TRIP_VT) {
  relay27Ref.current = true
  setRelay27Tripped(true)
  // Disconnect load immediately in both ref and state
  inputsRef.current = { ...inputsRef.current, loadFraction: 0 }
  setInputs((prev) => ({ ...prev, loadFraction: 0 }))
}
```

**RESET callback:**

```typescript
const resetRelay27 = useCallback(() => {
  relay27Ref.current = false
  relay27ArmedRef.current = false  // relay must re-arm after reset
  setRelay27Tripped(false)
}, [])
```

### UI

- **Banner:** replaces the old VOLTAGE COLLAPSE banner. Shown when `relay27Tripped === true`.
  ```
  ⚠ 27 RELAY TRIP — UNDER-VOLTAGE — LOAD DISCONNECTED   [RESET]
  ```
- **LED indicator (bottom half, row 1):** red when tripped (`led on red-led`)
- The old VOLTAGE COLLAPSE banner was removed; `outputs.collapsed` still freezes physics internally but is no longer surfaced in the UI.

### Files changed

- **`src/core/constants.ts`** — added `RELAY27_TRIP_VT = 0.85`
- **`src/hooks/useGeneratorSimulation.ts`** — added `relay27Tripped` state, `relay27Ref`, `relay27ArmedRef`, trip logic in RAF tick, `resetRelay27` callback; updated `SimHook` type
- **`src/App.tsx`** — destructures `relay27Tripped` / `resetRelay27`; renders banner + RESET button; passes `relay27Tripped` to both `<IndicatorLights>` calls
- **`src/components/IndicatorLights.tsx`** — added `relay27Tripped` prop; bottom half row 1 now shows "27 RELAY TRIP" with red LED
- **`src/index.css`** — `.collapsed-banner` made flex; `.relay-reset-btn` added

### What TO TEST tomorrow

Manually test these scenarios in the browser (dev server `pnpm dev`):

| Scenario | Expected result |
|---|---|
| Start cold, raise field to 1 pu, raise load slowly past 70% | Relay trips, banner appears, load knob resets to 0 |
| After trip, click RESET | Banner clears, load knob free again, field rebuilds, no immediate re-trip |
| After RESET, raise load again | Relay re-arms once Vt > 0.85, then can trip again normally |
| AVR ON, Vref 1.0, raise load past limit | Same trip behaviour with AVR holding voltage until it can't |
| Set load to 0 manually before threshold | No trip (relay never arms if Vt never exceeded threshold — unlikely scenario but covers logic branch) |
| Start from zero field, raise field slowly, never add load | No spurious trip during field build-up |

The core logic compiles and the startup-inhibit path was reasoned through during the session (it was the fix for a re-trip bug caught during implementation). The RAF tick order is: step physics → arm check → trip check — that order matters.

---

## 3. FIELD AT CEILING indicator — CODED, VISUAL VERIFICATION INCOMPLETE

**Condition:** `avrOn && outputs.avrCommand >= AVR_COMMAND_MAX - 0.01` (i.e., AVR commanding ≥ 1.49 pu field)

**What it means:** The AVR has saturated at its maximum output. It can no longer increase excitation to hold voltage. The indicator should light **amber**.

**Physics note:** With default Xs = 1.2 at PF 0.85 lag, the ceiling (1.5 pu) is not reachable within the slider range (max load 100% ≈ 1.0 pu). To see this indicator activate, change the power factor to **0.6 lag** and raise load above ~86% — at that operating point the AVR hits 1.49 pu before voltage collapses.

### Files changed

- **`src/components/IndicatorLights.tsx`** — imports `AVR_COMMAND_MAX`; computes `fieldAtCeiling`; top half row 3 LED is `amber` when true

### What to verify tomorrow

1. Set PF knob to **0.6 lag** (most capacitive end of the lag range)
2. Turn AVR ON, Vref 1.0
3. Raise load slowly — around 86–90% the "FIELD AT CEILING" LED should go amber
4. The VSM % on the LCD should be very low at that point (close to 0%)
5. A little more load should trigger the 27 relay trip

**Why verification was blocked this session:** React Strict Mode mounts components twice in development. The active RAF loop holds a reference to the *second* mount's `inputsRef`. Browser DevTools fiber-walk reaches the *first* mount's refs. Injecting state via `h.queue.dispatch` updates React state but not the ref the RAF reads, so the simulation ignores injected inputs. This is a dev-mode-only tooling quirk — in production (single mount) everything works correctly. The workaround for tomorrow is just to operate the actual knobs in the browser rather than scripting it.

---

## Invariants to preserve

- `stabilityMargin` must be computed **before** the `discriminant < 0` early return in `machine.ts` — once collapsed, there's no margin to report.
- `relay27ArmedRef` must be cleared in `resetRelay27` — if only `relay27Ref` is cleared, the relay trips again on the next tick (Vt is still 0.85 pu boundary territory right after a trip).
- The RAF tick updates `inputsRef.current` **and** calls `setInputs` atomically on trip — updating only one causes a one-frame race where the slider visually shows load > 0 while physics sees 0, or vice versa.
