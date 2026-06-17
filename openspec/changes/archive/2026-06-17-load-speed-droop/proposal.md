## Why

The simulator's rotor speed is purely valve-driven: increasing load with a fixed valve has no effect on RPM, which is physically wrong and mis-teaches a foundational concept. Replacing the kinematic first-order speed lag with a swing-equation integrator makes load→speed coupling visible and correct: more electrical load than the valve supplies as mechanical power slows the rotor.

## What Changes

- Replace the first-order kinematic speed lag (`TAU_SPINUP`) in `simulation.ts` with a swing-equation ODE integrator: `dω/dt = (Pm − Pe − D·(ω − 1)) / (2H)`.
- Add inertia constant `H` (s) and damping coefficient `D` (pu) to `Params`.
- Map valve position to mechanical power `Pm`: `Pm_pu = valveActual / 100`.
- Remove `TAU_SPINUP` from constants (inertia is now captured by `H`); the kinematic lag is replaced, not supplemented.
- Update existing spin-up lag tests to reflect the new dynamics model.

## Capabilities

### New Capabilities

_(none — this modifies existing speed dynamics, no new feature surface)_

### Modified Capabilities

- `simulation-core`: Speed integration requirement changes from first-order kinematic lag to swing-equation power-balance. `Params` gains `H` and `D`.
- `turbine-governor`: "Kinematic spin-up lag" requirement is replaced by the swing-equation integrator; valve position maps to mechanical power rather than a speed target.

## Impact

- `src/core/simulation.ts` — speed integration step (core change)
- `src/core/constants.ts` — new `H` and `D` params; `TAU_SPINUP` removed
- `src/core/types.ts` — `Params` adds `H`, `D`; `TAU_SPINUP` import removed from simulation
- `src/core/simulation.test.ts` — spin-up lag tests (3.3, 3.5) replaced with swing-equation tests
- `openspec/specs/simulation-core/spec.md` and `openspec/specs/turbine-governor/spec.md` — requirement update
