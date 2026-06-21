# Synchronous Generator Simulator — Implementation Status

**Updated:** June 21, 2026  
**Branch:** main

---

## Summary

Phases 1, 2, and Phase 3 Stages 3a–3d are all complete. The simulator models a diesel harbour-tug
generator with the full swing equation, isochronous governor, damper windings, and a load breaker that
delivers a single-step instantaneous load event. 108 tests passing; 0 TypeScript errors.

---

## Phase Completion

| Stage | Description | Status |
|---|---|---|
| Phase 1 | Islanded generator — exciter, AVR, voltage, ANSI-27 | ✅ complete |
| Phase 2 | RPM / frequency — valve, governor speed-changer, kinematic lag | ✅ complete |
| Saturation & AVR tuning | Saturation curve, second field lag, Kp/Ki | ✅ complete |
| 3a | Rotor swing dynamics — swing equation, inertia H | ✅ complete |
| 3b | Automatic governor — isochronous PI, rate limiter | ✅ complete |
| 3c | Damper windings — D·(ω−ωref) in swing equation | ✅ complete |
| 3d | Cold-start load pickup — load breaker, TAU_VALVE 0.3 s, LCD tiles | ✅ complete |
| Governor PID sliders | Expose GOV_KP/KI as UI inputs | planned |
| 3e | Overvoltage & load shedding — ANSI-59, ANSI-81 | planned |
| Arming limits review | Hysteresis, GOV inhibit, inhibit indicators | planned |
| 4a | Second generator startup | spec ready — not implemented |
| 4b | Synchronisation — synchroscope, ANSI-25 | planned |
| 4c | Droop, load sharing, reverse power — ANSI-32 | planned |
| 4d | Consumer-triggered standby start | planned |

---

## Stage 3d — What Changed

Stage 3d is the most recent completed stage. Key changes:

- **Load breaker** (`LoadBreaker` component): gates the active-load Knob as a single instantaneous
  step. Open = Pe 0 (Vt → Ea); close = full Knob value applied in one tick. Armed at ≥ 0.95 pu
  (~1425 rpm). `loadBreaker: boolean` added to `Inputs` (default `false`).
- **`TAU_VALVE`** revised from 2.0 s (steam) to **0.3 s** (diesel fuel rack). Governor can now
  meaningfully chase a load step.
- **`dampingTorque`** (`D·(ω−ωref)`) added to `Outputs`. LCD tile shows passive amortisseur torque —
  zero at steady state, spikes transiently on load steps.
- **Throttle % LCD tile** (`valveActual`): replaces the `PositionIndicator` twin-needle dial (which was
  uninformative at 0.3 s lag). `PositionIndicator` component retained in codebase.
- **Panel layout**: row 1 / col 6 now mounts `LoadBreaker` instead of `PositionIndicator`.

---

## Core Physics (`src/core/`)

| File | Status | Notes |
|---|---|---|
| `simulation.ts` | ✅ current | Swing eq + damper + breaker gating + dampingTorque |
| `constants.ts` | ✅ current | TAU_VALVE = 0.3; INERTIA_H = 4; DAMPING_D = 0.05 |
| `types.ts` | ✅ current | loadBreaker in Inputs; dampingTorque in Outputs |
| `machine.ts` | ✅ current | Steady-state phasor solver |
| `governor.ts` | ✅ current | PI speed controller |
| `avr.ts` | ✅ current | PI voltage controller |
| `saturation.ts` | ✅ current | Piecewise-linear OCC |
| `load.ts` | ✅ current | Constant-power load model |
| `presets.ts` | ✅ current | cold-dark / spinning-dark / live-loaded; all loadBreaker: false |

---

## UI (`src/`)

| Component | Status | Notes |
|---|---|---|
| `App.tsx` | ✅ current | Footer: PHASE 3D; LoadBreaker at row 1 / col 6 |
| `LoadBreaker.tsx` | ✅ new (3d) | OPEN/CLOSED; arming interlock at 0.95 pu |
| `StatusDisplay.tsx` | ✅ current | THR % and DMP tiles added; legend updated |
| `PositionIndicator.tsx` | retained | Not mounted on panel; available for synchroscope/steam |
| `Gauge.tsx` | ✅ current | |
| `Knob.tsx` | ✅ current | |
| `SelectorSwitch.tsx` | ✅ current | |
| `SpringLoadedSelector.tsx` | ✅ current | |
| `IndicatorLights.tsx` | ✅ current | |
| `ReadoutPanel.tsx` | ✅ current | |
| `ExciterChain.tsx` | ✅ current | |
| `useGeneratorSimulation.ts` | ✅ current | setLoadBreaker exposed |

---

## Tests

**18 test files / 108 tests / 0 failures**

New in Stage 3d (`load-breaker.test.ts`):
- Open breaker: Pe = 0, Q = 0 regardless of Knob
- Close breaker: load applied in one step (no ramp)
- `dampingTorque` = 0 at synchronous speed; proportional to slip
- `dampingTorque` identity check: D × (post-step omega − ωref)
- TAU_VALVE convergence: ~63 % of step reached at 0.3 s; >99 % at 1.5 s

All pre-existing tests updated: `loadBreaker: true` added wherever non-zero load was set.

---

## Specs (`openspec/specs/`)

| Spec | Status |
|---|---|
| `simulation-core/spec.md` | ✅ current through 3d (breaker gating, dampingTorque, TAU_VALVE) |
| `simulator-ui/spec.md` | ✅ current through 3d (LoadBreaker control, LCD tiles, layout) |
| `turbine-governor/spec.md` | ✅ current (TAU_VALVE 0.3 s) |
| `load-breaker/spec.md` | ✅ new (3d) |
| `valve-dial/spec.md` | ✅ updated (PositionIndicator mount requirements retired) |
| `saturation-curve/spec.md` | ✅ current |
| `exciter-chain/spec.md` | ✅ current |

---

## Next planned: Governor PID sliders

Expose `GOV_KP` and `GOV_KI` as adjustable UI inputs (mirroring the AVR Kp/Ki pattern). With
TAU_VALVE ~0.3 s the learner can feel the tradeoff between recovery speed and overshoot. Well-tuned
starting defaults: `GOV_KP ≈ 20`, `GOV_KI ≈ 2` (current hard-coded values are aggressive and
produce visible hunting). Teaching parallel: the derivative term does for control what the damper
winding does mechanically.
