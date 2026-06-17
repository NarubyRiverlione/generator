## Why

The review identified realism and robustness gaps that can mis-teach core concepts (exciter-chain settling, relay behavior) and can produce unstable outputs in edge cases (NaN around zero-excitation singularities). Addressing these now keeps the simulator trustworthy before further Phase 2 work is layered on top.

## What Changes

- Wire exciter-chain instruments to the lagged physical field signal rather than the AVR command signal.
- Harden simulation-core edge cases: prevent NaN/undefined outputs at degenerate operating points and sanitize out-of-range load inputs.
- Enforce ANSI-27 trip latch semantics in the UI driver so load stays disconnected until reset.
- Normalize field-voltage contract language across code/docs/specs to a single source of truth.
- Fix UI consistency issues surfaced in review (rated-valve legend text and spring selector touch-cancel handling).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `simulation-core`: Clarify and strengthen numerical-safety requirements for zero-excitation/zero-voltage states and invalid input bounds; expose lagged field signal for downstream readouts.
- `exciter-chain`: Require readouts to be driven by the lagged field signal used by the solver (not controller command).
- `simulator-ui`: Tighten relay-27 latch behavior, load-control lock semantics during trip, and control/readout consistency requirements.

## Impact

- Core math and state/output mapping in `src/core/` (`machine.ts`, `load.ts`, `simulation.ts`, `types.ts`)
- React driver behavior in `src/hooks/useGeneratorSimulation.ts`
- UI wiring and control behavior in `src/App.tsx` and `src/components/`
- Parameter/concept docs where field-voltage and simplification wording are inconsistent
- Core and integration tests in `src/core/*.test.ts`
