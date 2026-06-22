## Why

The AVR and Governor selector switches currently give no feedback about whether the regulator can
actually act. A learner who flips the AVR switch at 900 rpm or the governor switch at 1100 rpm gets
no visible indication that the system is inhibited — the switch just sits in the "on" position while
nothing happens. This is confusing and breaks the startup narrative.

Real marine switchgear uses **illuminated push buttons with integrated pilot lights**: the backlight
colour tells the operator the device's readiness state at a glance. Replacing both `SelectorSwitch`
controls with an `IlluminatedButton` component unifies the interaction pattern for both regulators
and makes the inhibit/arm/active state self-describing without any additional legend.

## What Changes

- **New `IlluminatedButton` component.** Latching push button with a backlight that cycles through
  three colours: amber (inhibited — speed below arm threshold), dark (available but off), green
  (active). Pressing while inhibited is a no-op; pressing while available toggles the regulator.
- **Governor underspeed inhibit (new).** Governor is inhibited below `OMEGA_GOV_ENABLE = 0.933 pu`
  (~1400 rpm = idle), matching the point where START has finished its job. This prevents governor
  integral windup during run-up and enforces the intended sequence: START → idle → governor engage.
- **Hysteresis on both inhibit thresholds.** Each regulator has an arm threshold and a disarm
  threshold (slightly lower) to prevent chattering at the boundary. The state is tracked inside
  `SimState` so the physics layer stays self-contained.
- **AVR disarm hysteresis (new).** AVR already arms at `OMEGA_AVR_ENABLE = 0.80 pu`; it now has an
  explicit disarm at `OMEGA_AVR_DISABLE = 0.77 pu`. No change to arm threshold.
- **`SelectorSwitch` replaced for both AVR and Governor.** The component stays in the codebase
  (same retention policy as `PositionIndicator`) but is no longer mounted on the panel.

## Capabilities

### New Capabilities
- `avr-governor-inhibit-buttons`: Visual arm/inhibit/active state for both regulators via
  `IlluminatedButton`; governor underspeed lockout; hysteresis on both thresholds; pressing while
  inhibited is a no-op.

### Modified Capabilities
- `simulator-ui`: AVR and Governor controls become `IlluminatedButton` instead of `SelectorSwitch`.
- `simulation-core`: `SimState` gains `avrArmed` / `govArmed` hysteresis booleans; `step()` adds
  governor inhibit gate and hysteresis logic for both regulators.

## Impact

- **Core:** `src/core/constants.ts` (three new threshold constants), `src/core/types.ts`
  (`SimState` and `Outputs` gain `avrArmed` / `govArmed`), `src/core/simulation.ts`
  (hysteresis logic in `initialState()` and `step()`).
- **Component:** `src/components/IlluminatedButton.tsx` (new); `src/styles/illuminated-button.css`
  (new); `src/index.css` (import).
- **UI:** `src/App.tsx` — swap `SelectorSwitch` → `IlluminatedButton` for AVR and Governor;
  pass `inhibited` prop from `outputs.avrArmed` / `outputs.govArmed`.
- **Docs:** `docs/naming.md` — add `IlluminatedButton` entry; `docs/roadmap.md` — record
  governor inhibit thresholds and `SelectorSwitch` retirement from AVR/Governor slots.
- **Tests:** hysteresis arm/disarm transitions; inhibit gate prevents regulator from running.
