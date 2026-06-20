## 1. Constants

- [ ] 1.1 Add `OMEGA_AVR_DISABLE = 0.77` to `src/core/constants.ts` (AVR disarm hysteresis threshold)
- [ ] 1.2 Add `OMEGA_GOV_ENABLE = IDLE_RPM / RPM_RATED` to `src/core/constants.ts` (governor arm threshold, derived from existing `IDLE_RPM`)
- [ ] 1.3 Add `OMEGA_GOV_DISABLE = 0.90` to `src/core/constants.ts` (governor disarm hysteresis threshold)

## 2. Types

- [ ] 2.1 Add `avrArmed: boolean` and `govArmed: boolean` to `SimState` in `src/core/types.ts`
- [ ] 2.2 Add `avrArmed: boolean` and `govArmed: boolean` to `Outputs` in `src/core/types.ts`

## 3. Simulation

- [ ] 3.1 In `initialState()`: derive initial `avrArmed` and `govArmed` from seed omega vs arm thresholds; include in returned `SimState` and `lastValidOutputs`
- [ ] 3.2 In `step()`: compute next `avrArmed` with hysteresis — stay armed unless `omega < OMEGA_AVR_DISABLE`; arm when `omega >= OMEGA_AVR_ENABLE`
- [ ] 3.3 In `step()`: compute next `govArmed` with hysteresis — stay armed unless `omega < OMEGA_GOV_DISABLE`; arm when `omega >= OMEGA_GOV_ENABLE`
- [ ] 3.4 In `step()`: replace the single-threshold `avrArmed` gate with the hysteresis-derived value from 3.2
- [ ] 3.5 In `step()`: add governor inhibit gate — governor PI only runs when `govArmed` is true; bumpless transfer primes the integral when inhibited (same pattern as the AVR)
- [ ] 3.6 In `step()`: write `avrArmed` and `govArmed` into `nextState` and into `outputs` (both collapsed and non-collapsed branches)

## 4. Hook

- [ ] 4.1 In `useGeneratorSimulation.ts`: after each `step()` call, check if `outputs.avrArmed` dropped to false while `inputs.avrOn` is true; if so, set `avrOn: false` (force-off on disarm)
- [ ] 4.2 Same for governor: check if `outputs.govArmed` dropped to false while `inputs.governorOn` is true; if so, set `governorOn: false`

## 5. Component — `IlluminatedButton`

- [ ] 5.1 Create `src/components/IlluminatedButton.tsx` with props `{ label: string; active: boolean; inhibited: boolean; onToggle: () => void }`
- [ ] 5.2 Pressing while `inhibited = true` is a no-op
- [ ] 5.3 Backlight: amber when `inhibited`, green when `active && !inhibited`, dark otherwise
- [ ] 5.4 Create `src/styles/illuminated-button.css`: square bezel, amber/green backlight with glow, dark base
- [ ] 5.5 Add `@import './styles/illuminated-button.css'` to `src/index.css`

## 6. UI — App.tsx

- [ ] 6.1 Import `IlluminatedButton` in `src/App.tsx`
- [ ] 6.2 Replace AVR `SelectorSwitch` (row 3, col 3) with `<IlluminatedButton label="AVR" active={inputs.avrOn} inhibited={!outputs.avrArmed} onToggle={() => setInput('avrOn', !inputs.avrOn)} />`
- [ ] 6.3 Replace Governor `SelectorSwitch` (col 6, row 3) with `<IlluminatedButton label="GOVERNOR" active={inputs.governorOn} inhibited={!outputs.govArmed} onToggle={() => setInput('governorOn', !inputs.governorOn)} />`
- [ ] 6.4 Remove `SelectorSwitch` import from `App.tsx` if no longer used elsewhere; otherwise retain

## 7. Docs

- [ ] 7.1 Add `IlluminatedButton` entry to `docs/naming.md`: latching push button with integrated backlight; amber = inhibited, dark = available/off, green = active; used for AVR and Governor
- [ ] 7.2 In `docs/roadmap.md` Fixed Parameters table: add governor inhibit thresholds (`OMEGA_GOV_ENABLE = 0.933 pu / 1400 rpm`, `OMEGA_GOV_DISABLE = 0.90 pu`) and AVR disarm threshold (`OMEGA_AVR_DISABLE = 0.77 pu`)
- [ ] 7.3 In `docs/roadmap.md` User Inputs table: update AVR and Governor rows to note `IlluminatedButton` instead of `SelectorSwitch`; note inhibit thresholds
- [ ] 7.4 In `docs/roadmap.md` layout section: update the layout diagram to reflect `IlluminatedButton` for AVR and Governor; note `SelectorSwitch` retained but unmounted

## 8. Tests

- [ ] 8.1 AVR arm hysteresis: omega rising through `OMEGA_AVR_ENABLE` arms the AVR; omega falling through `OMEGA_AVR_DISABLE` disarms it
- [ ] 8.2 Governor arm hysteresis: omega rising through `OMEGA_GOV_ENABLE` arms the governor; omega falling through `OMEGA_GOV_DISABLE` disarms it
- [ ] 8.3 Governor inhibit gate: with `governorOn = true` and `omega < OMEGA_GOV_ENABLE`, valve is driven by jog (not PI); integral does not wind up
- [ ] 8.4 AVR inhibit gate: with `avrOn = true` and `omega < OMEGA_AVR_ENABLE`, field is driven by `fieldVoltage` input (not PI)
- [ ] 8.5 Hysteresis prevents disarm at arm threshold: omega at exactly `OMEGA_AVR_ENABLE` with already-armed state stays armed
