## 1. Power-factor floor removal (#5 — done)

- [x] 1.1 `App.tsx` `handlePfChange` — lagging floor 0.92 → 0.6 (symmetric `const min = 0.6`)
- [x] 1.2 `App.tsx` power-factor knob — `scaleMin` label "0.92 lag" → "0.6 lag"
- [x] 1.3 `core/types.ts` — PF range comment → `[0.6, 1.0]` both sides
- [x] 1.4 Verify `tsc` clean and existing tests green (the low-PF collapse is handled by the existing collapse/relay path)

## 2. New core outputs (#6 — physics)

- [x] 2.1 `core/types.ts` — add `saturationFactor: number` and `droopRpm: number` to `Outputs`
- [x] 2.2 `core/simulation.ts` — compute `saturationFactor = iField > 0 ? saturation(iField)/iField : 1` and `droopRpm = Pe · govDroop · RPM_RATED`; include in both the collapsed and normal output branches (plus both `initialState` branches)
- [x] 2.3 Tests: `saturationFactor` = 1.0 below knee, < 1.0 above knee; `droopRpm` = 0 at no load, = Pe·govDroop·1500 under load (`__tests__/integration/diagnostics.test.ts`)

## 3. LCD readouts (#6 — UI)

- [x] 3.1 `components/StatusDisplay.tsx` — display saturation derate (`SAT %`) and load-droop rpm (`DRP rpm`) on `l3` alongside Q (three space-between spans on the wide cols 2-4 screen)
- [x] 3.2 Add matching sticky-note legend lines for both readouts (`SAT`, `DRP`)
- [x] 3.3 Confirm the saturation/droop readouts update live and read 100 % / 0 rpm at rest (verified in-app: `l3` reads `SAT 100%` / `DRP 0 rpm` at the field-0 start state; three-span layout clean against the two-span lines)

## 4. Verify

- [x] 4.1 `pnpm test` green (69 tests incl. new diagnostics), core coverage 92.3 % (≥ 90 %)
- [ ] 4.2 Manual: pull PF toward 0.8 lag at full load → voltage sags past the trip and collapses (expected); saturation-derate and droop readouts move sensibly

## Out of scope (separate bugfix pass)

- Valve-position removal from the LCD, active-load max 150 → 120 %, exciter/rectifier gauge headroom, terminal-voltage gauge rezone. This change only adds the saturation/droop readouts to the LCD; the valve-line removal is handled there.

## Rejected (see design D1)

- Raising the saturation ceiling to hold voltage at 0.8 PF, and defaulting the start PF to 0.95 — dropped in favour of keeping realistic physics and exposing the collapse limit.
