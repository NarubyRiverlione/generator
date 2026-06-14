## Why

Engineers and students learn synchronous-generator behaviour far better by manipulating it than by reading equations. There is no interactive, physics-honest tool in this repo that lets a user feel how exciter field voltage, load, and AVR regulation push terminal voltage, power, reactive output, and load angle around in near-real time. Phase 1 (MVP) builds that islanded, steady-state simulator as the foundation the later roadmap phases (frequency control, grid sync, grid-connected operation) all build on.

## What Changes

- Add a pure, React-free physics core that solves the round-rotor machine each frame from inputs — outputs **emerge** from the circuit solve, never from a scripted formula.
- Model the load as **constant power**: the active-load (%) and power-factor sliders specify load P and Q directly; terminal voltage Vₜ and load angle δ are solved for, given the internal EMF Eₐ, via the quadratic in Vₜ².
- Handle **voltage collapse** gracefully: past the PV nose the quadratic has no real root — freeze the last valid operating point and surface an explicit "collapsed/unstable" state, never NaN or gauge jank.
- Apply a **first-order time lag** (τ = 1.5 s) to the exciter field so the whole chain settles over ~1.5 s when field DC changes.
- Drive the **exciter-chain readouts** (AC output, rectified DC, main field current) as cascaded constant gains on the lagged field signal.
- Add an optional **AVR** as a PI controller (Kp = 2.0, Ki = 0.5) acting on the Vₜ error, commanding the field setpoint, with integral anti-windup and the command clamped to [0.5, 1.5]. When AVR is on, the field-DC slider becomes read-only and displays the AVR command; the Vref slider becomes visible.
- Add the **generator readouts**: Vₜ and P as SVG arc gauges (270° sweep, green/amber/red zones, no charting library), plus numeric Q (with supplying/absorbing label), δ (with a near-90° stability warning), and calculated power factor.
- Add the **input panel** (field-DC, active-load, power-factor sliders; AVR toggle + Vref) and a responsive two-column/stacked **layout**.
- Rotor speed and frequency are **fixed at 50 Hz** — no speed slider, no frequency readout, and no `freqFactor` in the core. Frequency variation is deferred to Phase 2 per the PRD; the core's `Inputs` shape and solver signature stay frequency-free for the MVP.

## Capabilities

### New Capabilities

- `simulation-core`: The pure physics engine — per-unit base and fixed machine params, constant-power load model, the circuit solve (Vₜ, Iₐ, δ, P, Q, PF) including collapse handling past the PV nose, the first-order field lag, and the AVR PI controller with anti-windup. Fully unit-testable with zero React.
- `exciter-chain`: The exciter signal-chain readouts — exciter AC output, rectified DC to the field windings, and main rotor field current — derived as fixed-ratio cascaded gains on the lagged field signal, so all three move together as the field settles.
- `simulator-ui`: Everything visual and interactive — the input panel (sliders, AVR toggle, read-only field slider when AVR is on, Vref slider), the generator readouts (Vₜ/P SVG gauges, Q with supplying/absorbing label, δ with stability warning, calculated PF), the React driver hook owning the animation loop, and the responsive two-column/stacked layout.

### Modified Capabilities

<!-- None — this is a greenfield MVP; no existing specs. -->

## Impact

- New source tree under `src/` (`core/`, `hooks/`, `components/`) wired to the existing `index.html` → `/src/main.tsx` entry point, which is currently a stub.
- New tooling/deps: Vite + React + TypeScript, Vitest for the core unit tests. The user's personal ESLint/Prettier/TS configs load into the repo separately.
- No existing application code is affected (greenfield). The deleted `docs/PLAN.md` is superseded by this change's artifacts; `prd.md` remains the product source of truth.
- Establishes the `Inputs`/solver contract that Phase 2 (frequency) will extend — kept deliberately frequency-free so Phase 2 is the place that reopens it.
