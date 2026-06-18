## Why

Stages 3a/3b give an islanded machine with real inertia and an optional governor. The next concept is
**coupling to the grid**: a stiff external reference (the infinite bus) that the machine must join through
a breaker. This introduces the **power angle δ** — the heart of synchronous-machine behaviour — and the
synchronisation moment.

Because manual synchroscope artistry is deprioritised, this stage focuses on the *coupling mechanism and
the angle*, not on hand-matching finesse: the breaker may close automatically once conditions are roughly
met. Loss-of-step (pushing δ past pull-out) is deliberately held back to Stage 3d so this stage teaches
exactly one concept — being *in* step.

## What Changes

- **Add a simulated grid reference**: an infinite bus fixed at 400 V / 50 Hz (`Vgrid`, `ωgrid`).
- **Add the power angle δ** as the integral of the generator–grid frequency difference:

  ```
  δ = ∫ (ωgen − ωgrid) dt
  ```

  Even a tiny steady frequency error accumulates into phase — which is *why* frequency must be matched
  before closing.
- **Add the breaker** (open/closed). When closed, the machine couples to the grid through the synchronising
  power `Pmax · sin(δ)`, with `Pmax = Vt·Vgrid / Xs`; the swing equation gains this term as part of `Pe`.
- **Add a synchro-check gate (ANSI-25)**: the breaker close is permitted only when Δf, Δδ, and ΔV are
  within window; closing into a large mismatch produces a visible swing (but, this stage, δ stays below
  pull-out and the machine pulls into step).
- **Keep δ below the pull-out angle** — no pole-slip yet (Stage 3d).

## Non-goals

- **No loss-of-synchronism / out-of-step trip** — δ is held stable here; pushing past pull-out is Stage 3d.
- **No manual synchroscope hand-matching workflow** — deprioritised; the close can be gated/automatic. The
  synchroscope *instrument* may be a later refinement.
- **No grid-connected P/Q dispatch semantics** — that redefinition of the controls is Phase 4.
- No change to the islanded swing equation or governor beyond adding the synchronising-power term.

## Capabilities

### Modified Capabilities

- `simulation-core`: add the grid reference, power angle δ, breaker state, and the synchronising-power
  term in the swing equation; add the ANSI-25 synchro-check condition.
- `simulator-ui`: add a breaker control and close gate, surface δ and the grid reference, and show
  in-step status.

## Impact

- Affected specs: `simulation-core`, `simulator-ui`.
- Affected code: `src/core/simulation.ts` (δ integration, breaker-closed `Pe` term),
  `src/core/constants.ts` (`Vgrid`, `ωgrid`, synchro-check window), `src/core/types.ts` (breaker input, δ
  output, grid state), UI for the breaker and δ readout.
- Prerequisite: Stages 3a, 3b. Prerequisite for: Stage 3d (loss-of-synchronism) and Phase 4.
