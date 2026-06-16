## 1. Magnetic Saturation

- [ ] 1.1 Add saturation curve function in `src/core/saturation.ts`: piecewise linear through
      (0,0), (1.0, 1.0), (1.5, 1.2)
- [ ] 1.2 Apply saturation in `simulation.ts`: `Eₐ = saturation(field_lagged) × speed_pu`
      (replaces the bare `field_lagged × speed_pu` introduced by Phase 2)
- [ ] 1.3 Unit test: at field = 1.0 → Eₐ = 1.0 (knee exact)
- [ ] 1.4 Unit test: at field = 1.5 → Eₐ = 1.2 (ceiling)
- [ ] 1.5 Unit test: at field = 1.25 → Eₐ interpolates linearly between knee and ceiling
- [ ] 1.6 Manual: at rated load with AVR off, cranking field 1.0→1.5 gives a smaller Vₜ gain than 0.5→1.0

## 2. Second Field Time Constant

- [ ] 2.1 Add `TAU_EXCITER = 0.4` and split existing `tau = 1.5` into `TAU_FIELD = 1.1` in `constants.ts`
- [ ] 2.2 Add `exciterLagged` to `SimState` (initial = field default)
- [ ] 2.3 In `simulation.ts`: advance `exciterLagged` toward `fieldTarget` with `TAU_EXCITER`, then
      advance the field lag toward `exciterLagged` with `TAU_FIELD` (match the existing exact-exponential form)
- [ ] 2.4 Unit test: with high Kp AVR, Vₜ step response overshoots (peak Vₜ > vref) before settling
- [ ] 2.5 Unit test: at default Kp/Ki the step response remains stable (no sustained oscillation)

## 3. Adjustable Kp / Ki

- [ ] 3.1 Make Kp/Ki adjustable inputs (range: Kp 0.5–5.0, Ki 0.1–2.0, defaults Kp 2.0 / Ki 0.5)
- [ ] 3.2 Thread Kp/Ki from hook state into `step(..., params, dt)` instead of the fixed `PARAMS` const;
      add setters to the hook
- [ ] 3.3 Add Kp / Ki controls to the UI near the AVR selector
- [ ] 3.4 Manual: raise Kp to maximum → Vₜ visibly overshoots on field step; lower Kp → overshoot disappears
