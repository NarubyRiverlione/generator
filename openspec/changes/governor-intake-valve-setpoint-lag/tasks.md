## 1. Constants and Types

- [ ] 1.1 Add `TAU_VALVE = 2.0` constant to `src/core/constants.ts` with a doc comment explaining it is the valve actuator time constant (s), distinct from `TAU_SPINUP`
- [ ] 1.2 Add `valveActual: number` field to `SimState` in `src/core/types.ts` with a JSDoc comment: physical valve position (%), lags behind `valvePct` through actuator lag
- [ ] 1.3 Add `valveActual: number` field to `Outputs` in `src/core/types.ts` with a JSDoc comment: physical valve position (%), sourced from actuator-lagged state

## 2. Simulation Step

- [ ] 2.1 Import `TAU_VALVE` in `src/core/simulation.ts`
- [ ] 2.2 In `initialState()`, set `valveActual: VALVE_PCT_INIT` in the returned `SimState` (alongside existing `valvePct: VALVE_PCT_INIT`) so both start aligned
- [ ] 2.3 In `step()`, after integrating `valvePct`, compute `valveActual` using the exact-exponential first-order lag: `valveActual = state.valveActual + (valvePct - state.valveActual) * (1 - Math.exp(-dt / TAU_VALVE))`
- [ ] 2.4 Change the `rpmTarget` line to use `valveActual` instead of `valvePct`: `const rpmTarget = (valveActual / 100) * VALVE_RPM_MAX`
- [ ] 2.5 Add `valveActual` to the `nextState` object in `step()`
- [ ] 2.6 Include `valveActual` in both output paths in `step()` — the normal path and the collapsed freeze path (collapsed path must keep `valveActual` live, not frozen)

## 3. Outputs Wiring

- [ ] 3.1 In `initialState()`, add `valveActual: VALVE_PCT_INIT` to the `outputs` object (both the collapsed and normal branches)
- [ ] 3.2 Verify `step()` returns `valveActual` in `Outputs` for both collapsed and non-collapsed cases — ensure the collapsed path spreads `valveActual` from live state, not from `lastValidOutputs`

## 4. UI Wiring

- [ ] 4.1 In `src/App.tsx`, pass `outputs.valvePct` as the `setpoint` prop and `outputs.valveActual` as the `actual` prop on the `PositionIndicator` component (requires `twin-needle-valve-dial` to be merged first)

## 5. Verification

- [ ] 5.1 Run `dotnet format` (if applicable) and `npm run build` — confirm zero type errors
- [ ] 5.2 Manual check: hold fast jog, observe setpoint needle advances while actual needle lags; release switch, confirm actual needle closes the gap over ~2 s
- [ ] 5.3 Manual check: at startup, confirm both needles are aligned at ~93 % with no initial transient
- [ ] 5.4 Manual check: RPM/Hz readouts follow the actual needle (not the setpoint needle) during the lag period
