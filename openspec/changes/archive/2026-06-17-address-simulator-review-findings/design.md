## Context

The simulator is already aligned with the major architecture goals (pure core physics, React driver hook, phased functionality), but review uncovered specific correctness and resilience issues:

- Exciter-chain gauges are currently fed from AVR command instead of the lagged physical field signal.
- The machine solver has a singular edge at near-zero `Vt` and `Ea` that can emit non-finite values.
- ANSI-27 trip handling is edge-triggered but not fully latched against subsequent load writes.
- Field-voltage contract language is inconsistent across docs and type comments.
- Minor UI consistency and interaction gaps remain (rated-valve legend text and touch-cancel handling).
- Shaft speed is decoupled from load: `speedLagged` is driven solely by valve position with no torque-balance feedback, so increasing active load never slows the shaft. There is no swing equation or droop effect in the current model.

This is a cross-cutting fix set touching core equations/state typing, UI driver control flow, and docs.

## Goals / Non-Goals

**Goals:**
- Ensure exciter-chain readouts represent the same lagged field signal used by the core solver.
- Guarantee finite outputs from the core at degenerate operating points and invalid numeric inputs.
- Enforce relay-27 latched load-disconnect behavior until reset.
- Establish one canonical field-voltage contract and align code/docs to it.
- Close low-risk UI correctness gaps identified in review.

**Non-Goals:**
- No change to Phase 2 scope sequencing or follow-on change boundaries.
- No saturation, second field time constant, or AVR tuning feature work.
- No rework of core machine model into a full `Ra`-inclusive phasor power-equation solve.
- No swing equation or torque-balance feedback: the load→speed droop effect is a known simplification; fixing it is a separate, larger change.

## Decisions

### D1 - Expose lagged field in `Outputs`

Add a lagged field output (`iField`) to `Outputs`, sourced directly from simulation state after the field lag step. Use this value as the source for exciter-chain display calculations.

**Rationale:** The exciter-chain is a physical signal path and must reflect plant lag, not controller demand.

**Alternative considered:** Continue using `avrCommand` in UI and treat chain as "controller intent". Rejected because it teaches incorrect settling behavior.

### D2 - Numerical safety policy for degenerate points

Harden the core to avoid NaN/Infinity by:

- Sanitizing load inputs (`powerFactor`, `loadFraction`) to finite, physically meaningful ranges before trigonometric operations.
- Guarding divisor-sensitive calculations in the solver (`delta`, `ia`) with epsilon checks.
- Treating zero-excitation/zero-load as a valid finite rest state (`Vt=0`, `Ia=0`, `delta=0`) while preserving collapse handling for infeasible loaded states.

**Rationale:** The simulator should never emit undefined values, including during startup and pathological inputs.

**Alternative considered:** Only clamp final outputs if non-finite. Rejected because it hides root-cause instability and creates discontinuous behavior.

### D3 - Relay-27 latch enforced in effective inputs

While relay-27 is tripped, force effective `loadFraction` to `0` in simulation tick inputs and ignore direct load writes until reset clears trip state.

**Rationale:** This matches documented protection semantics: load is disconnected until operator reset.

**Alternative considered:** Allow writes but continuously overwrite to `0` every frame. Rejected as confusing and race-prone.

### D4 - Canonical field-voltage contract

Adopt current simulator behavior as canonical: field range `0.0-1.5 pu`, default `0.0 pu`, and align comments/docs/spec language to this single contract.

**Rationale:** This preserves existing startup/arming behavior and avoids introducing unrelated behavior changes in this corrective pass.

**Alternative considered:** Shift to `0.5-1.5` with default `1.0`. Rejected for this change because it alters startup pedagogy and protection flow expectations.

### D5 - Low-risk UI consistency fixes bundled with control work

Update the status legend rated-valve text to `~93.75%` and add `onTouchCancel` neutral-return handling for `SpringLoadedSelector`.

**Rationale:** Both are isolated, deterministic fixes with direct user-facing correctness impact.

## Risks / Trade-offs

- `[Added output surface]` -> Mitigation: keep `iField` additive and backward-compatible; existing consumers remain unaffected until explicitly migrated.
- `[Stricter relay latch]` -> Mitigation: keep UI state updates explicit so users see why load is held at zero while tripped.
- `[Canonicalizing to 0.0 default]` -> Mitigation: update docs/spec text in the same change to avoid future drift.
- `[Bundled low-priority fixes]` -> Mitigation: isolate with focused tests so regressions are easy to localize.

## Migration Plan

1. Add core/type changes first (`Outputs.iField`, solver guards, input sanitization).
2. Update UI wiring to consume lagged field and enforce relay latch semantics.
3. Apply small UI consistency fixes (legend text, touch-cancel neutral return).
4. Align docs/comments to canonical field contract and `Ra` simplification wording.
5. Verify with core tests and targeted UI/manual checks around trip/reset and control transients.

## Open Questions

- None for implementation start; all review findings are actionable under existing architecture.
