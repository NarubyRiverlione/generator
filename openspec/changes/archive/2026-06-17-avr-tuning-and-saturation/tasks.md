## 1. Magnetic Saturation

- [x] 1.1 Add saturation curve function in `src/core/saturation.ts`: piecewise linear through
      (0,0), (1.0, 1.0), (1.5, 1.2)
- [x] 1.2 Apply saturation in `simulation.ts`: `Eₐ = saturation(field_lagged) × speed_pu`
      (replaces the bare `field_lagged × speed_pu` introduced by Phase 2)
- [x] 1.3 Unit test: at field = 1.0 → Eₐ = 1.0 (knee exact)
- [x] 1.4 Unit test: at field = 1.5 → Eₐ = 1.2 (ceiling)
- [x] 1.5 Unit test: at field = 1.25 → Eₐ interpolates linearly between knee and ceiling
- [x] 1.6 Manual: at rated load with AVR off, cranking field 1.0→1.5 gives a smaller Vₜ gain than 0.5→1.0

## 2. Second Field Time Constant

- [x] 2.1 Add `TAU_EXCITER = 0.4` and split existing `tau = 1.5` into `TAU_FIELD = 1.1` in `constants.ts`
- [x] 2.2 Add `exciterLagged` to `SimState` (initial = field default)
- [x] 2.3 In `simulation.ts`: advance `exciterLagged` toward `fieldTarget` with `TAU_EXCITER`, then
      advance the field lag toward `exciterLagged` with `TAU_FIELD` (match the existing exact-exponential form)
- [x] 2.4 Unit test: with high Kp AVR, Vₜ step response overshoots (peak Vₜ > vref) before settling
- [x] 2.5 Unit test: at default Kp/Ki the step response remains stable (no sustained oscillation)

## 3. Adjustable Kp / Ki

- [x] 3.1 Make Kp/Ki adjustable inputs (range: Kp 0.5–5.0, Ki 0.1–2.0, defaults Kp 2.0 / Ki 0.5)
- [x] 3.2 Thread Kp/Ki from hook state into `step(..., params, dt)` instead of the fixed `PARAMS` const;
      add setters to the hook
- [x] 3.3 Add Kp / Ki controls to the UI near the AVR selector
- [x] 3.4 Manual: raise Kp to maximum → Vₜ visibly overshoots on field step; lower Kp → overshoot disappears

## 4. Test Regressions (TODO)

4 tests broken by tasks 1.x / 2.x — not introduced by 3.x:

- [x] `helpers.test.ts` — seeded state has `exciterLagged: 0` but `iField: 0.5`; iField drops on first step because two-lag model chases exciterLagged, not fieldTarget. Fix: seed `exciterLagged: 0.5` alongside `iField: 0.5`.
- [x] `no-load.test.ts` — expects `Vt ≈ 1.3` at `field = 1.3` but saturation makes `Ea = saturation(1.3) ≈ 1.12`. Fix: update expected value to `saturation(1.3) × speed_pu ≈ 1.12`.
- [x] `governor.test.ts` (3.1) — settle time `10 × PARAMS.tau = 11 s` (tau shrank 1.5→1.1); valve actuator not seeded to `valveActual: ratedValvePct`, so it starts offset and frequencyHz ends up 0.0054 Hz outside the `toBeCloseTo(50, 2)` tolerance. Fix: also seed `valveActual: ratedValvePct`.
- [x] `avr-second-order.test.ts` (2.4) — restructured to pre-settle under 0.3 pu load (integral grows for loaded op), then remove load with Kp=5.0; carried integral drives field above no-load set point → Vt transiently exceeds Vref.
