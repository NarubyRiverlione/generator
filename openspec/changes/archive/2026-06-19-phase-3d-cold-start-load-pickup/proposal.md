## Why

Stages 3a–3c gave the rotor inertia, a governor, and damper windings, but load is still applied as a
smooth turn of a Knob — the operator never experiences the violence of a real load step. On an islanded
machine the headline danger is throwing a large consumer onto the bus in one instant: the rotor must
absorb the full electrical power jump on inertia alone while the governor races to raise mechanical
power. This change adds that single-step event (the **load breaker**) and makes the inertia/governor
race observable, which is the whole point of Stage 3d. It also corrects `TAU_VALVE` from a steam-plant
value (2.0 s) to the diesel-throttle reality of a tug (~0.3 s), without which the load step recovers far
too sluggishly to teach the lesson.

## What Changes

- **Load breaker (new control).** A breaker button gates the existing active-load Knob. With the breaker
  **open**, the pre-set load is disconnected (`Pe` contribution = 0); **closing** it applies the full
  Knob value as one instantaneous step. The operator dials in the consumer, then throws the breaker. Too
  large a step → frequency dips hard, and beyond the machine's headroom → collapse/stall.
- **`TAU_VALVE` revision.** 2.0 s → ~0.3 s, reflecting a diesel throttle / fuel rack rather than a steam
  intake valve. The governor can now actually chase a load step.
- **Throttle % LCD tile; remove `PositionIndicator` from the panel.** At τ_valve ~0.3 s the twin needles
  (setpoint vs actual) are nearly coincident and the instrument loses its teaching value. The
  `PositionIndicator` component is **retained in the codebase** (may serve the synchroscope or a steam
  variant) but unmounted from the switchboard grid. `valveActual` is surfaced as an LCD tile instead,
  showing where the governor is driving the fuel rack.
- **Damping-torque LCD tile.** Expose `dampingTorque = D · (ω − ωref)` on `Outputs` and add an LCD tile.
  Shows the learner that the damper produces ~zero torque at steady state and a transient spike
  proportional to slip during the load step — a passive effect, in contrast to the active AVR/governor
  loops.

No breaking changes to the physics model; the swing equation and governor are unchanged. The active-load
Knob is retained (it now pre-sets load rather than applying it live).

## Capabilities

### New Capabilities
- `load-breaker`: A breaker that connects/disconnects the pre-set active load as a single instantaneous
  step, gating the active-load Knob. Defines breaker state, the step-application semantics, and the
  cold-start/load-pickup sequence behaviour.

### Modified Capabilities
- `simulation-core`: `Pe` seen by the swing equation is now gated by breaker state (open → load
  contributes 0). `Outputs` gains a `dampingTorque` field (`D · (ω − ωref)`). `TAU_VALVE` default
  changes to ~0.3 s.
- `turbine-governor`: the valve-actuator-lag requirement's `TAU_VALVE` value changes from 2.0 s to ~0.3 s
  (diesel throttle).
- `simulator-ui`: adds the load-breaker control, a throttle-% (`valveActual`) LCD tile, and a
  damping-torque LCD tile; removes the `PositionIndicator` from the row 1 / column 6 grid slot.
- `valve-dial`: the requirement that mounts `PositionIndicator` at row 1 / column 6 is retired (the
  component itself is kept, just no longer placed on the panel).

## Impact

- **Core:** `src/core/types.ts` (`Inputs` breaker flag, `Outputs.dampingTorque`), `src/core/constants.ts`
  (`TAU_VALVE` value), `src/core/simulation.ts` (gate `Pe` by breaker, compute `dampingTorque`),
  `src/core/presets.ts` (breaker default per preset).
- **UI:** `src/App.tsx` (grid: remove `PositionIndicator`, add breaker control),
  `StatusDisplay.tsx` (throttle % + damping-torque tiles), breaker control wiring through
  `useGeneratorSimulation`.
- **Docs:** `docs/roadmap.md` — mark Stage 3d ✓ on archive; footer/title `PHASE 3B` → `PHASE 3D`;
  reconcile `TAU_VALVE` and layout (`PositionIndicator` removed) in the parameter/layout tables.
- **Tests:** new load-step / breaker-close cases; `TAU_VALVE` recovery-time assertions; tile rendering.
