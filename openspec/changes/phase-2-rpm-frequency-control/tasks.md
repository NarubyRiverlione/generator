## 1. Core Types and Constants

- [ ] 1.1 In `src/core/constants.ts` add: fine-valve→speed band (0 %→47 Hz, 50 %→50 Hz, 100 %→53 Hz;
      0 % = low end of the band, not a closed valve), jog rates (`JOG_SLOW`, `JOG_FAST` in valve %/s),
      `TAU_SPINUP = 2.5`, and `POLES = 4`. (Coarse throttle valve / run-up from 0 rpm is Phase 3.)
- [ ] 1.2 Add a valve-rate command to `Inputs` in `src/core/types.ts` representing the raise/lower
      switch position (e.g. `valveCommand: -2 | -1 | 0 | 1 | 2`, default 0)
- [ ] 1.3 Add `frequencyHz`, `rpm`, and `valvePct` to `Outputs` in `src/core/types.ts`
- [ ] 1.4 Add `valvePct` (initial 50) and `speedLagged` (initial 1.0 pu) to `SimState` in `src/core/types.ts`

## 2. Physics — Simulation Core

- [ ] 2.1 In `simulation.ts` step, integrate the valve: `valvePct += jogRate(valveCommand) × dt`,
      clamped to [0, 100]; it holds when `valveCommand` is 0
- [ ] 2.2 Map valve to target speed (linear band) and advance the spin-up lag toward it using the same
      exact-exponential form as the field lag: `speedLagged += (speedTarget_pu − speedLagged) × (1 − exp(−dt / TAU_SPINUP))`
- [ ] 2.3 Scale internal EMF before the solver: pass `field_lagged × speedLagged` as Eₐ into
      `solveMachine` (replaces the bare `field_lagged` first argument)
- [ ] 2.4 Derive and return `frequencyHz = 50 × speedLagged`, `rpm = (120 / POLES) × frequencyHz`,
      and `valvePct` in the step output
- [ ] 2.5 Ensure initial state (`valvePct = 50`, `speedLagged = 1.0`) leaves default behaviour
      identical to Phase 1 (50 Hz / 1500 rpm at the nominal valve)

## 3. Tests — Simulation Core

- [ ] 3.1 Rated speed (nominal valve, speed_pu = 1.0) reproduces the Phase 1 baseline Vₜ, P, Q for given field + load
- [ ] 3.2 Valve held lower long enough → `speedLagged` settles so `frequencyHz` ≈ 47 Hz and `rpm` ≈ 1410
- [ ] 3.3 Valve step → after one τ_spinup (2.5 s) the lagged speed has moved ~63 % toward the new target
- [ ] 3.4 Speed reduction with AVR off causes Vₜ to fall (Eₐ scaled down) — set field high enough that Vₜ stays above the 0.85 relay trip
- [ ] 3.5 Spin-up lag and field lag are independent (step both; each settles at its own τ)
- [ ] 3.6 `valveCommand = 0` holds `valvePct` constant; outer command integrates faster than inner

## 4. Hook — useGeneratorSimulation

- [ ] 4.1 Hold the raise/lower switch position (`valveCommand`) in hook state; default neutral (0)
- [ ] 4.2 Pass `valveCommand` into the core step as part of `Inputs`
- [ ] 4.3 Expose a setter for the switch position from the hook

## 5. UI — Governor speed-changer switch

- [ ] 5.1 Add a spring-return raise/lower switch to the panel, styled like the AVR selector: neutral
      centre, two-stage throw (`⏪ ◀ ● ▶ ⏩`), spring-return to neutral on release
- [ ] 5.2 Wire press-and-hold to set `valveCommand` while held and back to 0 on release
- [ ] 5.3 Position it as the right-hand speed/frequency bookend in the switchboard grid, mirroring the
      exciter-field control on the left

## 6. UI — Readouts

- [ ] 6.1 Add an **RPM** readout (headline) and an **Hz** readout to the generator-output area,
      near terminal voltage; RPM to whole numbers, Hz to one decimal
- [ ] 6.2 Add a **fine-valve-position** readout (0–100 % of the governing band) so the commanded valve is visible
- [ ] 6.3 Update footer text from `PHASE 1 MVP` to `PHASE 2`

## 7. Smoke Test and Polish

- [ ] 7.1 Nominal valve (50 %) → 1500 rpm / 50 Hz, no change from Phase 1 visual behaviour
- [ ] 7.2 Hold lower → valve %, RPM, and Hz fall together and settle smoothly; Vₜ sags (AVR off)
- [ ] 7.3 AVR on + lower valve → exciter field rises to compensate Vₜ sag; RPM/Hz still drop
- [ ] 7.4 Confirm an aggressive valve reduction can drive Vₜ below 0.85 and trip the 27 relay
      (underspeed → undervoltage), and that this is intentional/legible
- [ ] 7.5 Run full test suite (`pnpm test`) — existing and new tests pass
- [ ] 7.6 Check the switch and readouts are usable on a narrow viewport
