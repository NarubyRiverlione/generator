## 1. Core Numerical Safety and Output Surface

- [x] 1.1 Add `iField` to `Outputs` in `src/core/types.ts` and propagate it from `initialState()` and `step()` in `src/core/simulation.ts`
- [x] 1.2 Harden `src/core/load.ts` to sanitize non-finite/out-of-range `loadFraction` and `powerFactor` before computing `acos`/`tan`
- [x] 1.3 Guard divisor-sensitive calculations in `src/core/machine.ts` so zero/near-zero `Ea` and `Vt` never produce `NaN`/`Infinity`
- [x] 1.4 Add/adjust core tests in `src/core/simulation.test.ts` for zero-excitation rest state, near-singular loaded inputs, and sanitized load-demand behavior

## 2. Exciter Chain and UI Wiring Corrections

- [x] 2.1 Update `src/App.tsx` to drive `ExciterChain` from lagged field output (`outputs.iField`) instead of AVR command
- [x] 2.2 Verify `src/ExciterChain.tsx` derives AC/DC/current readouts only from the lagged field signal path
- [x] 2.3 Update status legend text in `src/components/StatusDisplay.tsx` to reflect rated valve near `~93.75 %`

## 3. Relay-27 Latch and Control Semantics

- [x] 3.1 Enforce tripped relay effective-input clamp in `src/hooks/useGeneratorSimulation.ts` so simulation receives `loadFraction = 0` until reset
- [x] 3.2 Prevent direct load control writes from reintroducing load while relay is latched, while keeping user-visible state coherent
- [x] 3.3 Add/adjust tests around trip, latched interval, and post-reset re-arm behavior (hook-level or integration-level coverage)

## 4. Interaction Edge Cases and Documentation Alignment

- [x] 4.1 Add `onTouchCancel` neutral-return handling in `src/components/SpringLoadedSelector.tsx`
- [x] 4.2 Align field-voltage contract wording (`0.0-1.5 pu`, default `0.0`) across `src/core/types.ts`, parameter docs, and related concept docs
- [x] 4.3 Clarify `Ra` simplification wording in docs to explicitly state current solver treatment and rationale
- [x] 4.4 Add a code comment at the speed integration step in `src/core/simulation.ts` noting that speed is valve-driven only — load changes do not feed back into shaft speed (no swing equation / droop)

## 5. Verification

- [x] 5.1 Run `pnpm vitest run` and confirm all tests pass
- [x] 5.2 Run `pnpm vitest run --coverage` and confirm coverage gate remains green
- [x] 5.3 Run `pnpm build` and confirm zero TypeScript/build errors
- [x] 5.4 Manual verification: exciter-chain readouts visibly settle with field lag, relay trip holds load at zero until reset, and touch-cancel returns governor selector to neutral
