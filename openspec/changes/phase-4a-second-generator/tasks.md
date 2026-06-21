## 1. Extract `useGeneratorState` from `useGeneratorSimulation`

- [ ] 1.1 Create `src/hooks/useGeneratorState.ts`; copy all state, refs, engine command handling,
      auto-ramp logic, and relay logic from `useGeneratorSimulation.ts` into it
- [ ] 1.2 Add a `tick(dt: number): void` method to `useGeneratorState` — the body is the contents of
      the current rAF callback (process engine command → auto-ramp → call `step()` → update relay)
- [ ] 1.3 `useGeneratorState` does NOT start a rAF loop; it returns `SimHook & { tick: (dt: number) => void }`
- [ ] 1.4 Refactor `useGeneratorSimulation.ts` to call `useGeneratorState` and wrap it with its own
      rAF loop — returned interface stays `SimHook` (no change for existing consumers)
- [ ] 1.5 Verify existing single-gen presets (`cold-dark`, `spinning-dark`, `live-loaded`) work
      identically after the refactor

## 2. Extract `GeneratorPanel` component

- [ ] 2.1 Create `src/GeneratorPanel.tsx`; move all JSX inside `<div className="panel">` from
      `App.tsx` into it (excluding title `<p>` and footer `<p>`)
- [ ] 2.2 `GeneratorPanel` props: the full `SimHook` interface
      (`inputs`, `outputs`, `setInput`, `relay27Tripped`, `resetRelay27`, `setValveCommand`,
      `setLoadBreaker`, `startEngine`, `stopEngine`)
- [ ] 2.3 All derived values (`engineRunning`, `engineAtIdle`, `fieldValue`, `pfSigned`,
      `handlePfChange`) move inside `GeneratorPanel`
- [ ] 2.4 Verify panel renders identically to Phase 3d for a single generator

## 3. `StatusStrip` component

- [ ] 3.1 Create `src/components/StatusStrip.tsx`
- [ ] 3.2 Props: `gen1: { inputs: Inputs; outputs: Outputs }` and `gen2: { inputs: Inputs; outputs: Outputs }`
- [ ] 3.3 Render two value columns (Gen 1 left, Gen 2 right) and a shared label column on the right;
      rows in order: RPM, Hz, Vt, P, BKR, AVR, GOV
- [ ] 3.4 RPM: integer, no decimal. Hz: 1 decimal. Vt: integer (V). P: integer (kW).
- [ ] 3.5 BKR dot: filled when `inputs.loadBreaker === true`; hollow when false
- [ ] 3.6 AVR dot: filled when `inputs.avrOn && outputs.rpm >= OMEGA_AVR_ENABLE_RPM`; hollow otherwise
- [ ] 3.7 GOV dot: filled when `inputs.governorOn && outputs.rpm >= GOV_ARM_RPM`; hollow otherwise
      (derive `GOV_ARM_RPM` from `OMEGA_REF * RPM_RATED` = 1500 rpm or nearest constant)
- [ ] 3.8 No interactive elements — strip is read-only

## 4. Dual-generator `App.tsx` restructure

- [ ] 4.1 Replace the single `useGeneratorSimulation` call with two `useGeneratorState` calls:
      `gen1 = useGeneratorState(startParam)` and `gen2 = useGeneratorState('cold-dark')`
- [ ] 4.2 Add a single `useEffect` rAF loop that calls `gen1.tick(dt)` then `gen2.tick(dt)` with
      the same `dt`; use the same `MAX_DT = 0.1` and `TARGET_DT = 0.033` constants
- [ ] 4.3 Add `activeGen` state: `const [activeGen, setActiveGen] = useState<1 | 2>(1)`
- [ ] 4.4 Add `keydown` listener in a `useEffect` with cleanup:
      `'1'` → `setActiveGen(1)`, `'2'` → `setActiveGen(2)`;
      guard with `!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)`
- [ ] 4.5 Render outer layout: `<div className="app-layout">` containing `<StatusStrip>` and
      `<div className="panel-area">` (tab bar + active panel)
- [ ] 4.6 Render tab bar: two buttons labelled `GEN 1` and `GEN 2`; active tab has distinct styling;
      clicking switches `activeGen`
- [ ] 4.7 Render `<GeneratorPanel>` with props spread from `gen1` or `gen2` based on `activeGen`
- [ ] 4.8 Update panel title to `SYNCHRONOUS GENERATORS · 400 V · 50 Hz · 1 MVA · ISLANDED`
- [ ] 4.9 Update footer to `PHASE 4A · 400 V · 50 Hz · 1 MVA · ISLANDED · DUAL GENERATOR`

## 5. CSS — strip and tab bar

- [ ] 5.1 Add `.app-layout { display: flex; flex-direction: row; }` to wrap strip + panel area
- [ ] 5.2 Add `.status-strip { width: 160px; flex-shrink: 0; }` with panel-matching background
- [ ] 5.3 Add `.panel-area { flex: 1; min-width: 0; display: flex; flex-direction: column; }`
- [ ] 5.4 Add `.tab-bar` styles: flex row, two tab buttons, active tab visually distinguished
      (e.g. bolder border or background tint matching the panel aesthetic)
- [ ] 5.5 Add `.status-strip` row and column styles for the three-column (val1 | val2 | label) layout
- [ ] 5.6 Add indicator dot styles: `.dot-filled` and `.dot-hollow` (small circles, ~8 px)

## 6. Tests

- [ ] 6.1 `useGeneratorState` — tick advances simulation: after N ticks from cold-dark, `outputs.rpm`
      increases above 0 when valve is open
- [ ] 6.2 `useGeneratorState` — two independent instances: ticking gen1 does not affect gen2 state
- [ ] 6.3 Gen 2 always cold-dark: mount App with `?start=live-loaded`; confirm gen2 `outputs.rpm ≈ 0`
      on first render
- [ ] 6.4 STOP force-trips breaker: set `loadBreaker: true`, call `stopEngine()`, advance one tick;
      confirm `inputs.loadBreaker` is `false` before valve ramp begins
- [ ] 6.5 Keyboard shortcut: simulate `keydown` with key `'2'`; confirm `activeGen` switches to 2

## 7. Docs update (on archive)

- [ ] 7.1 In `docs/roadmap.md`: mark Stage 4a ✓ complete
- [ ] 7.2 Update layout diagram to show status strip + tab bar wrapping the 6-column panel
- [ ] 7.3 Note `GeneratorPanel` as the extracted panel component in the File Structure section
- [ ] 7.4 Note `useGeneratorState` as the stateful layer beneath `useGeneratorSimulation`
