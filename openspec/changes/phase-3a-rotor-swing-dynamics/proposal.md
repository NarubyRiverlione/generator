## Why

Phase 2 models rotor speed **kinematically**: the intake valve position *is* the speed target, and a
first-order lag glides `speedLagged` toward it (`src/core/simulation.ts`). This is a believable stand-in,
but speed is *commanded* — nothing about force or energy balance is modelled, so the simulator cannot
show *why* frequency moves, cannot run the shaft up from rest with real inertia, and cannot represent a
machine that falls out of step. Every later Phase 3 stage (governor, grid synchronisation, loss-of-step)
needs real rotor dynamics underneath it.

This stage replaces the kinematic lag with the **swing equation** — the textbook rotor dynamics every
power-systems course teaches. It is the foundation for the rest of Phase 3.

## What Changes

- **Replace the kinematic speed lag with the swing equation** in the simulation core:

  ```
  2H · dω/dt = Pm − Pe
  ```

  where `H` is the inertia constant (seconds of stored kinetic energy at rated speed), `Pm` is mechanical
  power in (set by the valve), and `Pe` is electrical power out (the load). Speed `ω` becomes the integral
  of power imbalance over inertia — a *result*, not an input.
- **Re-aim the valve**: the speed-changer now commands **mechanical power in (Pm)**, not a speed target.
  `valveActual` maps to Pm; `speedLagged` is replaced by an integrated `ω`.
- **Add the inertia constant `H`** (and a small damping term `D`) as machine parameters in `constants.ts`.
- **Add shaft run-up from rest** (0 → 1500 rpm): with the breaker open and `Pe ≈ 0`, surplus `Pm`
  accelerates the rotor through the swing equation.
- **Keep the output surface stable**: RPM, Hz, valve readouts still read from `ω`; only what *produces*
  `ω` changes.

## Behaviour shift (intended)

- A load step now makes frequency **dip, swing, and recover** instead of gliding calmly — exactly how a
  real grid's frequency behaves on inertia. Because the load is constant-power (no self-regulation), a
  **fixed valve has no stable frequency** after a load step: the operator must raise the valve to
  rebalance `Pm = Pe`. That manual frequency-chase is the core skill this stage teaches.

## Non-goals

- **No automatic governor** — holding frequency stays a manual operator task here (Stage 3b adds the
  auto-governor).
- **No grid, no breaker, no synchronisation** — islanded only (Stage 3c).
- **No loss-of-synchronism / pole-slip** — that requires the grid reference (Stage 3d).
- No change to the voltage/Q channel, the AVR, or saturation.

## Capabilities

### Modified Capabilities

- `simulation-core`: replace the kinematic speed model with swing-equation rotor dynamics; valve commands
  Pm; add `H`/`D` parameters and run-up from rest.

### Added Capabilities

- (none — speed/RPM/Hz outputs already exist; their *derivation* changes.)

## Impact

- Affected specs: `simulation-core` (RPM/frequency/valve requirement and the speed model), possibly
  `simulator-ui` (readout copy, if any references "valve sets speed").
- Affected code: `src/core/simulation.ts` (integration step), `src/core/constants.ts` (`H`, `D`),
  `src/core/types.ts` (params/state for inertia).
- Prerequisite for: Stages 3b, 3c, 3d.
