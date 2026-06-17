## 1. Parameters and Types

- [ ] 1.1 Add `govDroop: number` to `Params` type in `src/core/types.ts` (dimensionless, pu/pu)
- [ ] 1.2 Add `govDroop: 0.04` to `PARAMS` constant in `src/core/constants.ts`

## 2. Speed Integration

- [ ] 2.1 In `src/core/simulation.ts`, compute `Pe_prev = state.lastValidOutputs.p` before the speed step
- [ ] 2.2 Replace `speedTarget_pu` (plain kinematic) with `effectiveTarget = speedTarget_pu - Pe_prev * params.govDroop` as the argument to the first-order speed lag
- [ ] 2.3 Remove the comment "Speed is driven by valve position only — load changes do not feed back into shaft speed. There is no swing equation or droop" (no longer accurate); replace with one clarifying the droop-corrected model

## 3. Tests

- [ ] 3.1 Update test 3.3 (`spin-up lag: 63 % moved after 1 τ_spinup`) to use zero load (`loadFraction: 0`) so the kinematic-only behavior is tested cleanly
- [ ] 3.2 Update test 3.5 (`spin-up lag and field lag are independent`) to use zero load for the same reason
- [ ] 3.3 Add test: valve at rated, load increases to 0.5 pu → settled RPM is lower than 1500 by approximately `0.5 × govDroop × RPM_RATED` (±5 rpm tolerance)
- [ ] 3.4 Add test: no-load (Pe = 0) at rated valve → settled RPM still ≈ 1500 (no regression)

## 4. Verification

- [ ] 4.1 Run `pnpm vitest run` and confirm all tests pass
- [ ] 4.2 Run `pnpm vitest run --coverage` and confirm coverage gate remains green
- [ ] 4.3 Run `pnpm build` and confirm zero TypeScript/build errors
- [ ] 4.4 Manual: add load with valve fixed → RPM visibly drops; raise valve → RPM recovers
