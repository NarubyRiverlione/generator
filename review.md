# Simulator Realism Review

## Scope

Review of implementation against `README.md` and `docs/prd.md`, focused on realism, teaching fidelity, and edge-case behavior.

## Overall Assessment

The core implementation broadly matches the intended educational model:

- Per-unit physics and solver pipeline are separated from UI.
- AVR PI control with anti-windup is present.
- Governor path (valve -> rpm -> Hz) is implemented.
- Relay-27 startup arming logic exists.

Current state is strong for intuition-building, but a few shortcuts and edge-case gaps reduce realism and robustness.

## High Priority Findings

1. Exciter chain display bypasses field lag

- In `src/App.tsx:37`, `ExciterChain` is driven by `outputs.avrCommand`.
- This shows controller command, not lagged physical field response.
- Teaching impact: users see near-instant chain movement instead of first-order settling over tau.

2. Solver singularity at zero excitation / zero voltage

- In `src/core/machine.ts:49` and `src/core/machine.ts:53`, expressions divide by `vt * ea` and `vt`.
- With startup defaults (`src/core/constants.ts:35`, `src/core/constants.ts:36`), the model can hit `ea = 0` and `vt = 0`.
- Result: potential `NaN` in `delta` and `ia` in edge cases.

3. Relay 27 trip is not fully latched at input layer

- Trip edge forces load to zero in `src/hooks/useGeneratorSimulation.ts:63`.
- But `setInput` still allows raising `loadFraction` while tripped (`src/hooks/useGeneratorSimulation.ts:80`).
- Behavior differs from documented "load disconnected until reset" sequence.

## Medium Priority Findings

4. Range/default mismatch for field voltage

- Types/docs describe field range as `[0.5, 1.5]` (`src/core/types.ts:6`).
- UI knob allows `0..1.5` (`src/App.tsx:44`).
- Default input is `0` (`src/core/constants.ts:35`).
- This mismatch affects startup behavior and interpretability.

5. `R_a` documented but not used by solver

- `ra` exists in params (`src/core/constants.ts:7`, `src/core/types.ts:68`).
- Current solve path does not consume it.
- This is acceptable as a simplification, but should be explicitly and consistently framed as such.

6. Input hardening gap for power factor

- `computeLoad` in `src/core/load.ts:10` assumes valid PF range.
- Out-of-range PF can make `acos(powerFactor)` invalid and produce `NaN`.
- UI clamps values, but core is not defensive against invalid callers.

## Low Priority / UX-Consistency Findings

7. Sticky-note text mismatch for rated valve position

- `src/components/StatusDisplay.tsx:100` says `50 % = rated`.
- Model and docs place rated near `93.75 %`.

8. Touch interaction edge case on spring selector

- `src/components/SpringLoadedSelector.tsx` handles `onTouchEnd` but not `onTouchCancel`.
- Interrupted gestures can leave transient inconsistent command states.

9. Phase 2 implementation split across change sets

- README/PRD correctly indicate Phase 2 is ongoing.
- Core Phase 2 governor/rpm/hz mechanics are present in code, while two follow-on discovered changes are spec'd but not yet implemented.
- Treat this as planned partial delivery, not documentation drift.

## Verification Evidence

- Test suite passes: `pnpm vitest run` (35/35).
- Coverage run passes: `pnpm vitest run --coverage`.
- Core coverage is strong overall, but the singular startup/zero-excitation corner is still vulnerable.

## Recommended Fix Order

1. Add solver guards for `ea ~= 0` / `vt ~= 0` to prevent `NaN` propagation.
2. Drive `ExciterChain` from lagged field state/output, not raw AVR command.
3. Enforce relay-27 latch semantics so load remains disconnected until reset.
4. Align field range/default across docs, types, constants, and UI.
5. Add defensive clamping/validation inside core load computations.
