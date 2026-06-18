## 1. Parameters and types

- [x] 1.1 Add inertia constant `H` (s) to `src/core/constants.ts` with a starting value (~3–5 s); add comment that it sets run-up / drift timescale. Confirm exact value with the user (feel-tunable, see design Open Questions). Do NOT add a damping coefficient `D` — the 3a swing equation is undamped by design (see design D2).
- [x] 1.2 Add `PM_MAX` constant to `src/core/constants.ts`, anchored so `Pm ≈ 1.0` pu at the rated valve position (~93.75 %), i.e. `PM_MAX ≈ 1.07`.
- [x] 1.3 Remove `TAU_SPINUP` from `src/core/constants.ts`.
- [x] 1.4 Remove `govDroop` from `Params` and `PARAMS` in `src/core/constants.ts` and `src/core/types.ts`.
- [x] 1.5 In `src/core/types.ts`: rename `SimState.speedLagged` → `SimState.omega` (update doc comment: integrated rotor speed, not a lag).
- [x] 1.6 In `src/core/types.ts`: add `pm` to `Outputs` (mechanical power in, pu) and remove `droopRpm`.

## 2. Swing-equation rotor dynamics (simulation core)

- [x] 2.1 In `src/core/simulation.ts` `step()`: replace the kinematic speed block (rpmTarget → droop-corrected effectiveTarget → spin-up lag) with the swing equation. Compute `Pm = (valveActual / 100) * PM_MAX`.
- [x] 2.2 Integrate `omega` with forward Euler (undamped, no `D` term): `omega = state.omega + ((Pm - Pe) / (2*H)) * dt`, using `Pe = state.lastValidOutputs.p` (previous-step electrical power).
- [x] 2.3 On a collapsed solve, feed `Pe = 0` into the swing equation (load rejection) instead of the frozen last-valid `p`.
- [x] 2.4 Clamp `omega`: floor at 0; cap at the overspeed ceiling `VALVE_RPM_MAX / RPM_RATED` (~1.067).
- [x] 2.5 Derive readouts from `omega`: `rpm = omega * RPM_RATED`, `frequencyHz = rpm / 30`. Keep `Eₐ = saturation(iField) * omega`.
- [x] 2.6 Set `outputs.pm = Pm`; remove all `droopRpm` computation from both the collapsed and non-collapsed output branches.
- [x] 2.7 Update `nextState` to carry `omega` (drop `speedLagged`).

## 3. Initial state and presets

- [x] 3.1 In `initialState()` (`src/core/simulation.ts`): rename `speedLagged` → `omega` (seed + derivation); set `outputs.pm` from the seeded valve; remove `droopRpm`. The `SPEED_INIT_PU` default stays for `spinning-dark` parity.
- [x] 3.2 In `src/core/presets.ts`: rename `speedLagged` → `omega` in the `cold-dark` (`omega = 0`), `spinning-dark` (`omega ≈ 0.9967`), and `live-loaded` (`omega ≈ 1.0`) seeds.
- [x] 3.3 Verify `spinning-dark`'s empty seed still reproduces no-argument `initialState()` field-for-field (regression anchor).

## 4. UI readouts

- [x] 4.1 In `src/components/StatusDisplay.tsx` (and `src/hooks/useGeneratorSimulation.ts` if it surfaces `droopRpm`): replace the load-droop RPM readout with the power-balance readout `pm − p` (`Pm − Pe`). Keep the saturation-derate readout.
- [x] 4.2 Update the LCD reference legend / sticky note copy to describe the power-balance readout instead of load-droop.

## 5. Tests

- [x] 5.1 Update `src/core/__tests__/unit/initial-state.test.ts` and `presets.test.ts` for the `speedLagged` → `omega` rename and `droopRpm` → `pm` output change.
- [x] 5.2 Update/replace `src/core/__tests__/integration/governor.test.ts`: drop the droop-offset assertions; add run-up-from-rest (`omega 0 → rising` with `Pe = 0`), fixed-valve-drift (no stable frequency after a load step), and valve-raise-arrests-drift cases.
- [x] 5.3 Update `src/core/__tests__/integration/diagnostics.test.ts`: replace `droopRpm` assertions with `pm` / power-balance assertions; keep `saturationFactor` cases.
- [x] 5.4 Add swing-equation unit cases: linear drift rate `(Pm − Pe)/(2H)` under fixed imbalance; overspeed clamp at `VALVE_RPM_MAX`; `Pe = 0` on collapse (rotor accelerates).
- [x] 5.5 Run `pnpm test` (or project test runner) and confirm ≥ 90 % coverage on changed core files.

## 6. Spec sync and docs

- [x] 6.1 Update the `turbine-governor` spec **Purpose** line (delta operates on requirements only): change "kinematic spin-up lag" → swing-equation rotor dynamics when syncing/archiving.
- [x] 6.2 Update the proposal's **Impact → Affected specs** to include `turbine-governor` and `simulator-ui` (scope was wider than first stated).
- [x] 6.3 Run `openspec validate phase-3a-rotor-swing-dynamics`; lint/format and typecheck the project.
