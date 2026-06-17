## 1. Core Types and Constants

- [ ] 1.1 In `src/core/constants.ts` replace the fine-valve band constants with `VALVE_RPM_MAX = 1600`
      (overspeed trip, ~107 % rated) and `RPM_RATED = 1500`. Keep `JOG_SLOW`, `JOG_FAST`, `TAU_SPINUP`,
      and `POLES`. Map is: `rpmTarget = (valvePct / 100) × VALVE_RPM_MAX`; Hz is never an intermediate.
- [x] 1.2 Add a valve-rate command to `Inputs` in `src/core/types.ts` representing the raise/lower
      switch position (e.g. `valveCommand: -2 | -1 | 0 | 1 | 2`, default 0)
- [x] 1.3 Add `frequencyHz`, `rpm`, and `valvePct` to `Outputs` in `src/core/types.ts`
- [ ] 1.4 Set `valvePct` initial value to ~93.1 (giving ~1495 rpm) and `speedLagged` to
      `1495 / 1500 ≈ 0.9967 pu` in `SimState` in `src/core/types.ts`

## 2. Physics — Simulation Core

- [x] 2.1 In `simulation.ts` step, integrate the valve: `valvePct += jogRate(valveCommand) × dt`,
      clamped to [0, 100]; it holds when `valveCommand` is 0
- [ ] 2.2 Map valve to RPM target (linear, shaft-primary) and advance spin-up lag:
      `rpmTarget = (valvePct / 100) × VALVE_RPM_MAX`;
      `speedTarget_pu = rpmTarget / RPM_RATED`;
      `speedLagged += (speedTarget_pu − speedLagged) × (1 − exp(−dt / TAU_SPINUP))`
- [x] 2.3 Scale internal EMF before the solver: pass `field_lagged × speedLagged` as Eₐ into
      `solveMachine` (replaces the bare `field_lagged` first argument)
- [ ] 2.4 Derive outputs shaft-first: `rpm = speedLagged × RPM_RATED`, `frequencyHz = rpm / 30`.
      Return `rpm`, `frequencyHz`, and `valvePct` in step output. (Hz is the final readout, not an
      intermediate variable in the derivation chain.)
- [ ] 2.5 Verify that initial state (`valvePct ≈ 93.1`, `speedLagged ≈ 0.9967`) starts the sim at
      ~1495 rpm / ~49.8 Hz with Eₐ ≈ 0.9967 × field

## 3. Tests — Simulation Core

- [ ] 3.1 Rated-valve scenario: at ~93.75 % valve (settled), `rpm` = 1500 and `frequencyHz` = 50;
      Vₜ, P, Q match the Phase 1 baseline for the same field and load
- [ ] 3.2 Low-valve scenario: valve held at, say, 60 % long enough to settle →
      `rpm` ≈ 960, `frequencyHz` ≈ 32 (60 % × 1600 / 30)
- [ ] 3.3 Spin-up lag: valve step → after one τ_spinup (2.5 s) lagged speed ~63 % toward new target
- [x] 3.4 Speed reduction with AVR off causes Vₜ to fall (Eₐ scaled down) — set field high enough
      that Vₜ stays above the 0.85 relay trip
- [x] 3.5 Spin-up lag and field lag are independent (step both; each settles at its own τ)
- [x] 3.6 `valveCommand = 0` holds `valvePct` constant; outer command integrates faster than inner

## 4. Hook — useGeneratorSimulation

- [x] 4.1 Hold the raise/lower switch position (`valveCommand`) in hook state; default neutral (0)
- [x] 4.2 Pass `valveCommand` into the core step as part of `Inputs`
- [x] 4.3 Expose a setter for the switch position from the hook

## 5. UI — Governor speed-changer switch

- [x] 5.1 Add a spring-return raise/lower switch to the panel, styled like the AVR selector: neutral
      centre, two-stage throw (▼▼ ▼ ● ▲ ▲▲), spring-return to neutral on release
- [x] 5.2 Wire press-and-hold to set `valveCommand` while held and back to 0 on release
- [x] 5.3 Position it as the right-hand speed/frequency bookend in the switchboard grid, mirroring the
      exciter-field control on the left

## 6. UI — Readouts

- [x] 6.1 Add an **RPM** readout (headline) and an **Hz** readout to the generator-output area,
      near terminal voltage; RPM to whole numbers, Hz to one decimal
- [x] 6.2 Add a **valve-position** readout (0–100 %) so the current valve opening is visible
- [x] 6.3 Update footer text from `PHASE 1 MVP` to `PHASE 2`

## 7. Smoke Test and Polish

- [ ] 7.1 At initial state (~93.1 % valve) → ~1495 rpm / ~49.8 Hz; raise to ~93.75 % → exactly
      1500 rpm / 50 Hz; visual behaviour matches Phase 1 at that speed
- [ ] 7.2 Hold lower → valve %, RPM, and Hz fall together and settle smoothly; Vₜ sags (AVR off)
- [x] 7.3 AVR on + lower valve → exciter field rises to compensate Vₜ sag; RPM/Hz still drop
- [x] 7.4 Confirm an aggressive valve reduction can drive Vₜ below 0.85 and trip the 27 relay
      (underspeed → undervoltage), and that this is intentional/legible
- [x] 7.5 Run full test suite (`pnpm test`) — existing and new tests pass
- [x] 7.6 Check the switch and readouts are usable on a narrow viewport
