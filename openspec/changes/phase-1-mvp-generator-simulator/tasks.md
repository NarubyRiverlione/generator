## 1. Scaffold & tooling

- [ ] 1.1 Add Vite + React + TypeScript scaffold (`package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/main.tsx`, `src/vite-env.d.ts`) wired to the existing `index.html`
- [ ] 1.2 Add Vitest config (core tests in `node` environment) and `test` / `coverage` scripts
- [ ] 1.3 Pause for the user to drop in personal ESLint / Prettier / TS configs, then run `pnpm install`

## 2. Core types & per-unit base

- [ ] 2.1 `core/types.ts` — `Inputs` (field DC, load %, power factor, AVR on/off, Vref), `SimState`, `Outputs` (incl. `collapsed` flag), `Params`; explicit types, frequency-free per design D4
- [ ] 2.2 `core/constants.ts` — fixed params (Xₛ = 1.2, Rₐ = 0.05, τ = 1.5 s, Kp = 2.0, Ki = 0.5) and default `Inputs`
- [ ] 2.3 `core/units.ts` — per-unit base (S_base, V_LL_base, f_rated) and display conversions applied only at the edge
- [ ] 2.4 `core/complex.ts` — minimal complex arithmetic (add/sub/mul/div/abs/arg)

## 3. Core physics

- [ ] 3.1 `core/load.ts` — constant-power load demand from sliders: P, Q with lag → Q>0, lead → Q<0 (spec: constant-power load model)
- [ ] 3.2 `core/machine.ts` — quadratic-in-Vₜ² solve, upper root, derive Vₜ/Iₐ/δ/P/Q/PF; Rₐ per design D3; `collapsed` when discriminant < 0, retain last valid output, no NaN
- [ ] 3.3 `core/avr.ts` — PI controller on Vₜ error, command clamped to [0.5, 1.5], integral anti-windup
- [ ] 3.4 `core/simulation.ts` — `initialState()` and `step(state, inputs, params, dt)`: first-order field lag (τ), AVR vs slider target select, call machine solve, return `{ state, outputs }`

## 4. Core tests (green before any UI)

- [ ] 4.1 No-load edge: load 0 % ⇒ Vₜ ≈ Eₐ, Iₐ ≈ 0
- [ ] 4.2 Field step settles over τ: ~63 % after 1τ, essentially complete after ~4τ
- [ ] 4.3 Load↑ AVR off ⇒ Vₜ drops; δ increases monotonically with load
- [ ] 4.4 Load↑ AVR on ⇒ field rises, settled Vₜ within tolerance of Vref
- [ ] 4.5 Power factor sign: lag ⇒ Q>0 (supplying), lead ⇒ Q<0 (absorbing)
- [ ] 4.6 Voltage collapse: past the nose ⇒ `collapsed` true, last valid retained, no NaN; recovery clears the flag
- [ ] 4.7 AVR anti-windup: command never leaves [0.5, 1.5], integral bounded under sustained error
- [ ] 4.8 Confirm ~90 % coverage on `core/`

## 5. React driver hook

- [ ] 5.1 `hooks/useGeneratorSimulation.ts` — rAF loop (~30 ms cadence, real `dt`, clamp large `dt`), hold `Inputs`/`Outputs` in state, delegate all math to `core.step`; return `{ inputs, setInput, outputs }`

## 6. Components & styling

- [ ] 6.1 `components/Gauge.tsx` — SVG 270° arc, green/amber/red zones (±15 % / ±25 % of rated), numeric label
- [ ] 6.2 `components/InputPanel.tsx` — field DC / load / power-factor sliders with numeric labels; field slider read-only when AVR on; no rotor-speed control
- [ ] 6.3 `components/AvrControl.tsx` — AVR on/off toggle; Vref slider visible only when AVR on
- [ ] 6.4 `components/ExciterChain.tsx` — AC out / rectified DC / field current readouts (cascaded gains, settle together)
- [ ] 6.5 `components/ReadoutPanel.tsx` — Vₜ & P gauges; numeric Q (supplying/absorbing), δ (warning near 90° + collapsed state), calculated PF
- [ ] 6.6 `src/index.css` — hand-rolled industrial/SCADA theme via CSS variables

## 7. Assemble & verify

- [ ] 7.1 `components/App.tsx` — two-column desktop / stacked mobile layout, readouts ordered by signal chain; wire hook to panels
- [ ] 7.2 `pnpm dev` manual acceptance walkthrough of every PRD criterion (field settle ~1.5 s; load sag AVR off; AVR hold; leading PF → absorbing; δ warning; collapse handling)
- [ ] 7.3 Mobile check: narrow viewport stacks and stays usable
