## Context

Phase 1 builds a greenfield, islanded, steady-state synchronous-generator simulator (see `prd.md` and `proposal.md`). The repo currently has only a stubbed `index.html` pointing at a non-existent `/src/main.tsx`. There is no prior application code. `prd.md` is the product source of truth; the previously-committed `docs/PLAN.md` was deliberately deleted and is superseded by these artifacts.

Two non-negotiable constraints shape the design:

1. **Physics-honest** — outputs must emerge from solving the machine's equations each frame, never from a scripted formula that fakes the behaviour. If the solve is honest, every PRD acceptance criterion falls out for free.
2. **Strict UI / physics separation** — all physics live in a pure, React-free `src/core/` layer that Vitest tests directly. The hook is a thin driver; components are pure presentation.

Stack: Vite + React + TypeScript, pnpm, hand-rolled CSS (no UI/charting library — gauges are custom SVG). Core tests run in Vitest's `node` environment (no jsdom needed). ESLint/Prettier/TS configs are the user's personal configs, loaded into the repo separately.

## Goals / Non-Goals

**Goals:**
- A pure `core/` that solves Vₜ, Iₐ, δ, P, Q, PF each frame from inputs, fully unit-tested.
- Constant-power load model so the δ→90° stability limit and voltage collapse emerge from the math.
- Graceful behaviour past the PV nose — no NaN, no gauge jank.
- First-order field lag (τ = 1.5 s) and an AVR PI loop (Kp = 2.0, Ki = 0.5) with anti-windup.
- A frequency-free `Inputs`/solver contract that Phase 2 will extend.

**Non-Goals:**
- Rotor speed / frequency variation (no speed slider, no `freqFactor` in core — Phase 2).
- Magnetic saturation, transient/sub-transient reactances, faults, grid connection, parallel machines, harmonics.
- Polished theming. Industrial look is desirable but not a Phase 1 acceptance gate.

## Decisions

### D1 — Constant-power load model (not constant impedance)
The active-load % and power-factor sliders specify the load's P and Q directly, independent of voltage. Given Eₐ and (P, Q), solve the round-rotor equations for Vₜ and δ.

*Why:* It is the literal reading of the PRD's inputs (you dial in P and PF), and it produces a genuine PV nose — so the δ→90° warning and voltage collapse are real physics, not decoration. The discriminating acceptance criterion is "δ warning near 90°": under constant impedance δ only nears 90° approaching a dead short, with no collapse, so the warning would teach the wrong lesson.

*Alternative considered:* Constant impedance (linear, always solvable, no NaN). Rejected as the default because the stability limit becomes cosmetic — though the PRD's "even if just a text label" hint shows it would be tolerated. Constant power is chosen for physical fidelity, accepting the cost in D2.

### D2 — Solve method and collapse handling
Let `A = 3·Eₐ/Xₛ` (the factor 3 cancels in per-unit). Squaring and adding the two power equations gives a quadratic in `u = Vₜ²`:

```
(9/Xₛ²)·u² + (6Q/Xₛ − 9Eₐ²/Xₛ²)·u + (P² + Q²) = 0
```

Take the **upper root** (physically stable operating point), then `Vₜ = √u`, and back out δ, Iₐ, P_check, Q_check, PF from the solved phasors. When the discriminant < 0 the load exceeds maximum loadability: set a `collapsed` flag, **retain the last valid output**, and emit no NaN. Recovery clears the flag once a real root reappears.

*Why upper root:* the lower root is the unstable low-voltage solution; real machines sit on the upper branch.

*Alternative considered:* iterative Newton solve. Rejected — the closed-form quadratic is exact, cheaper, and trivially testable.

### D3 — Rₐ treatment
Keep Rₐ = 0.05 pu in the phasor circuit relation `Eₐ = Vₜ + Iₐ(Rₐ + jXₛ)` for Iₐ/phasor work, but use the classic Rₐ-neglected power equations (`P = 3VₜEₐ/Xₛ·sinδ`, `Q = …`) for the quadratic solve. The error from neglecting a 0.05 pu resistance in the power equations is negligible and keeps the solve closed-form.

*Why:* honesty where it matters (the phasor relation), simplicity where it doesn't (the quadratic). Documented simplification.

### D4 — Frequency-free core (Phase 2 seam)
The `Inputs` type and `solveCircuit` signature carry **no** speed/frequency term in Phase 1. `Eₐ = iField` directly; `Xₛ` is constant. Phase 2 is the single place that reopens the solver to add `speedHz`, `freqFactor`, and `Xs_eff`.

*Why:* keeps the MVP surface minimal and avoids carrying an untested code path. The seam is explicit so Phase 2 knows exactly what it extends.

### D5 — Field lag and AVR layering
Field current chases its target through a first-order lag: `iField += (target − iField)·(1 − e^(−dt/τ))`, advanced by real `dt`. The AVR is a PI controller **on top of** that lag: `e = Vref_pu − Vₜ_pu`, `raw = Kp·e + Ki·∫e`, `command = clamp(raw, 0.5, 1.5)`. With AVR on, `target = command`; with AVR off, `target = fieldVoltage` slider. Anti-windup: stop integrating (or back-calculate) while the command is clamped.

*Why this is stable:* the plant (field→Vₜ) is dominantly a first-order lag (τ = 1.5 s); a PI controller on a first-order plant yields a stable, well-damped second-order closed loop for positive gains. The lag is the dominant pole the PI is tuned around — they do not fight. The one danger zone is near collapse where plant gain dVₜ/dEₐ blows up; the clamp + anti-windup contain it.

### D6 — Exciter chain as cascaded constant gains
`fieldVoltage → (τ lag) → iField → [×k_ac] exciter AC → [×k_rect] rectified DC → [×k_field] field current`. The lag is applied **once** at the input; the readouts are pure functions of the single lagged signal, so they cannot diverge from the EMF-driving current.

### D7 — Architecture: pure core / thin hook / pure components
`components → hooks → core`, dependency arrow one-way; `core/` imports no React.

```
src/
  core/        complex.ts, units.ts, constants.ts, types.ts,
               load.ts, machine.ts, avr.ts, simulation.ts   (pure, Vitest)
  hooks/       useGeneratorSimulation.ts                    (rAF driver only)
  components/  Gauge, InputPanel, ExciterChain, ReadoutPanel, AvrControl, App
  index.css    hand-rolled industrial theme
  main.tsx
```

Per the user's global conventions: explicit types (no `var`), primary-constructor-style minimalism where applicable, interfaces/types in their own files, file-level doc block at top only, single-line comments elsewhere. Vitest, ~90 % coverage target on `core/`.

## Risks / Trade-offs

- **Voltage collapse produces no real root** → freeze last valid state + `collapsed` flag; gauges hold rather than NaN. Cover with an explicit "past the nose" test.
- **AVR instability near the PV nose** (plant gain diverges/flips sign) → clamp command to [0.5, 1.5] + integral anti-windup; test that the command never escapes the range under sustained error.
- **Constant-power model is less forgiving than constant-Z** → accepted deliberately for physical fidelity; collapse handling (above) is the mitigation, and it doubles as the teaching moment.
- **δ=90° exact only when Vₜ is held** (AVR on); AVR off the nose can arrive slightly before 90° → treat "δ near 90°" as the warning threshold (amber ~70°, red near 90°), document the nuance, do not complicate the model.
- **rAF cadence vs fixed step** → integrate with real elapsed `dt` so settling time is wall-clock-correct regardless of frame rate; clamp very large `dt` (e.g. tab refocus) to avoid a jump.
- **Personal lint/TS configs load separately** → after scaffold, pause for the user to drop in configs before `pnpm install`, so formatting/lint match their setup from the first commit.

## Migration Plan

Greenfield — no migration. Build order validates physics before any UI:
1. Scaffold Vite + React + TS + Vitest; central per-unit base & constants.
2. Pause for the user to load personal ESLint/Prettier/TS configs; then `pnpm install`.
3. Core modules: `complex` → `units` → `load` → `machine` → `avr` → `simulation`.
4. Vitest core tests green before any component work.
5. `useGeneratorSimulation` hook (rAF driver).
6. Components + industrial CSS.
7. Wire `App`, responsive layout, manual acceptance walkthrough.

Rollback is trivial (delete `src/`); nothing else depends on it yet.

## Open Questions

- Exact exciter-chain gain constants (`k_ac`, `k_rect`, `k_field`) and display ranges — pick plausible engineering values; they are cosmetic and do not affect the EMF used by the solver.
- AVR anti-windup style: simple integration-halt vs back-calculation — start with integration-halt; revisit only if settling looks sluggish.
- δ warning thresholds (amber ~70°, red near 90°) — confirm against the visual feel during the manual pass.
