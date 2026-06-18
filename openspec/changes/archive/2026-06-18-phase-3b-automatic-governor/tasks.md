## 1. Core Types and Constants

- [x] 1.1 Add `governorOn: boolean` and `coarseValveCommand: ValveCommand` to `Inputs` in `src/core/types.ts` (defaults `false` / `0`)
- [x] 1.2 Add `governorIntegral: number` to `SimState` in `src/core/types.ts`
- [x] 1.3 Add `governorCommand: number` to `Outputs` in `src/core/types.ts`
- [x] 1.4 Add `OMEGA_REF`, `GOV_KP`, `GOV_KI`, `JOG_COARSE_SLOW` (= 0.625 %/s ≈ 10 rpm/s), `JOG_COARSE_FAST` (= 1.5625 %/s ≈ 25 rpm/s) to `src/core/constants.ts`
- [x] 1.5 Add `governorOn: false` and `coarseValveCommand: 0` to `DEFAULT_INPUTS` in `src/core/constants.ts`

## 2. Governor Controller

- [x] 2.1 Create `src/core/governor.ts` with `stepGovernor(omegaRef, omega, integralIn, kp, ki, dt) → { command, integral }` mirroring `avr.ts` — PI with anti-windup, command clamped to `[0, 100]`

## 3. Simulation Step Integration

- [x] 3.1 Import `stepGovernor` and new constants in `src/core/simulation.ts`
- [x] 3.2 Initialise `governorIntegral` in `initialState()` (seed or 0)
- [x] 3.3 Update the valve jog step to combine fine and coarse commands additively: `valvePct = clamp(valvePct + (fineJog(inputs.valveCommand) + coarseJog(inputs.coarseValveCommand)) × dt)` when governor is off
- [x] 3.4 Add governor branch: when `governorOn`, call `stepGovernor` and use result as `valvePct`; prime integrator for bumpless transfer when off
- [x] 3.5 Propagate `governorCommand` into `Outputs` (both normal and collapsed branches)
- [x] 3.6 Carry `governorIntegral` in the returned state

## 4. UI — Coarse Speed-Changer

- [x] 4.1 Add a coarse `SpringLoadedSelector` to the input panel alongside the existing fine switch
- [x] 4.2 Wire `coarseValveCommand` into the simulation inputs via the driver hook

## 5. UI — Governor Selector and Speed-Changer Lock

- [x] 5.1 Add governor on/off `SelectorSwitch` to the input panel (near the speed-changers)
- [x] 5.2 Wire `governorOn` into the simulation inputs via the driver hook
- [x] 5.3 Make both speed-changers read-only when `governorOn` is `true`, displaying `Outputs.governorCommand`
- [x] 5.4 Restore both speed-changers to interactive when `governorOn` is `false`

## 6. UI — Governor-at-Ceiling Indicator

- [x] 6.1 Add a governor-at-ceiling amber indicator that lights when `governorOn && Outputs.governorCommand >= 100`

## 7. Verification

- [ ] 7.1 Manual test: coarse switch — confirm it moves valve at ~2× fine fast rate (hold both for same duration)
- [ ] 7.2 Manual test: both switches held simultaneously — valve moves at combined rate
- [ ] 7.3 Manual test: enable governor at steady state — confirm frequency holds at 50 Hz after a load step without operator action
- [ ] 7.4 Manual test: disable governor — confirm both speed-changers jog as expected
- [ ] 7.5 Manual test: bumpless transfer — flip governor on/off mid-run and confirm no valve kick
- [ ] 7.6 Manual test: ceiling indicator — open valve to 100 % while governor on and confirm amber indicator lights
