## 1. Constants

- [x] 1.1 Add `DAMPING_D = 0.05` to `src/core/constants.ts`

## 2. Swing Equation

- [x] 2.1 Update the swing equation in `src/core/simulation.ts` to subtract `DAMPING_D * (state.omega - OMEGA_REF)` from the net torque before dividing by `2 * INERTIA_H`

## 3. Spec Update

- [x] 3.1 Update the purpose line in `openspec/specs/simulation-core/spec.md` to say "damped swing equation" and remove the "SHALL NOT include a damping term" sentence from the "Swing-equation rotor dynamics" requirement
- [x] 3.2 Update the "Inertia parameter" requirement in `openspec/specs/simulation-core/spec.md` to reflect that `DAMPING_D` is now present

## 4. Tests

- [x] 4.1 Add a unit test verifying that with `DAMPING_D > 0`, the peak rpm deviation under a load step is smaller than with `DAMPING_D = 0`
- [x] 4.2 Add a unit test verifying that `DAMPING_D * (omega - OMEGA_REF) = 0` when `omega = OMEGA_REF` (no steady-state error introduced)
