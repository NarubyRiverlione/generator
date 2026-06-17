## Why

The `phase-2-rpm-frequency-control` change originally bundled three features: the turbine governor
(rotor speed / frequency control) and two unrelated excitation-side features — magnetic saturation and
a second field time constant with adjustable AVR gains. The latter two belong to the *voltage* channel,
not the speed channel, and were carved out of Phase 2 to keep that change focused on its name.

This change collects the AVR-tuning and saturation work as a standalone, learning-focused unit: it lets
users see the AVR "struggle" against a non-linear plant and tune the PI controller against a
second-order field response that can overshoot.

## What Changes

- Add **magnetic saturation**: replace the linear Eₐ/field mapping with a piecewise open-circuit
  characteristic that flattens above the knee, so the AVR ceiling becomes visible.
- Add a **second field time constant**: replace the single field lag (τ = 1.5 s) with two stacked
  first-order lags (τ_exciter + τ_field) so the AVR step response can overshoot and ring.
- Make **Kp and Ki user-adjustable** so users can tune the AVR against the now-second-order,
  saturating plant and observe overshoot appearing and being damped out.

## Capabilities

### New Capabilities
- `saturation-curve`: non-linear Eₐ/field mapping (open-circuit characteristic).

### Modified Capabilities
- `simulation-core`: field-to-Eₐ mapping applies the saturation curve; field dynamics use two stacked
  first-order lags instead of one; Kp/Ki become inputs rather than fixed constants.
- `simulator-ui`: expose Kp and Ki as adjustable controls near the AVR selector.

## Impact

- Depends on `phase-2-rpm-frequency-control` being applied first (saturation multiplies the same Eₐ
  that speed scales: `Eₐ = saturation(field) × speed_pu`).
- `src/core/saturation.ts` (new), `src/core/simulation.ts` (two lags + saturation),
  `src/core/constants.ts` (TAU_EXCITER, TAU_FIELD, saturation breakpoints),
  `src/core/types.ts` (second lag state), the hook (Kp/Ki state + setters), and the AVR UI.
- No new dependencies.
