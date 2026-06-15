## 1. Core Types and Constants

- [ ] 1.1 Add `SPEED_MIN_HZ = 47`, `SPEED_MAX_HZ = 53`, `TAU_SPEED = 0.5` to `src/core/constants.ts`
- [ ] 1.2 Add `speedHz: number` to `SimulatorInputs` in `src/core/types.ts` (default 50)
- [ ] 1.3 Add `frequencyHz: number` to `SimulatorOutputs` in `src/core/types.ts`
- [ ] 1.4 Add `speedLagged: number` to `SimulatorState` in `src/core/types.ts` (initial value 1.0 pu)

## 2. Physics — Simulation Core

- [ ] 2.1 In `src/core/simulation.ts` step function, advance the speed lag: `speedLagged += (speedTarget_pu - speedLagged) × (dt / TAU_SPEED)` (first-order Euler, same pattern as field lag)
- [ ] 2.2 Scale internal EMF before the solver: `Ea_pu = fieldLagged × speedLagged` (replaces bare `fieldLagged` as the Ea input to the quadratic solver)
- [ ] 2.3 Derive and return `frequencyHz = 50 × speedLagged` in the step output
- [ ] 2.4 Ensure initial state sets `speedLagged = 1.0` and default `speedHz = 50` so existing behaviour is unchanged at default inputs

## 3. Tests — Simulation Core

- [ ] 3.1 Add unit test: rated speed (50 Hz) produces same Vₜ, P, Q as Phase 1 baseline for given field + load
- [ ] 3.2 Add unit test: speed 47 Hz → `frequencyHz` output is 47 Hz after lag settles
- [ ] 3.3 Add unit test: speed step to 53 Hz — after one τ_speed (0.5 s) the lagged speed has moved ~63 % toward target
- [ ] 3.4 Add unit test: speed reduction with AVR off causes Vₜ to fall (Eₐ scaled down)
- [ ] 3.5 Add unit test: speed lag and field lag are independent (step both simultaneously, each settles at its own τ)

## 4. Hook — useGeneratorSimulation

- [ ] 4.1 Add `speedHz` state (initial 50) to the hook
- [ ] 4.2 Pass `speedHz` into the core step function as part of `SimulatorInputs`
- [ ] 4.3 Expose `setSpeedHz` setter from the hook return value alongside existing setters

## 5. UI — Input Panel

- [ ] 5.1 Add turbine governor slider to `InputPanel.tsx`: range 47–53 Hz, step 0.1, default 50, label showing current Hz value
- [ ] 5.2 Wire slider onChange to `setSpeedHz` from the hook
- [ ] 5.3 Position the governor slider in the input panel (above or below active load — follows physical signal chain)

## 6. UI — Readout Panel

- [ ] 6.1 Add `frequencyHz` readout to `ReadoutPanel.tsx` as a numeric value labelled "Frequency" with unit "Hz" (one decimal place)
- [ ] 6.2 Place frequency readout in the generator output section, near terminal voltage

## 7. Smoke Test and Polish

- [ ] 7.1 Manually verify: governor at 50 Hz → no change from Phase 1 visual behaviour
- [ ] 7.2 Manually verify: reduce governor to 47 Hz → Vₜ sags, frequency readout drops to 47.0 Hz, settles smoothly over ~0.5 s
- [ ] 7.3 Manually verify: AVR on + governor reduction → exciter field rises to compensate Vₜ sag; frequency still drops
- [ ] 7.4 Run full test suite (`pnpm test`) — all existing tests pass, new tests pass
- [ ] 7.5 Check mobile layout — governor slider and frequency readout are usable on narrow viewport
