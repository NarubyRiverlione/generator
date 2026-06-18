## ADDED Requirements

### Requirement: Seeded initial state
The core SHALL provide `initialState(inputs?: Inputs, seed?: Partial<SimState>)`, which takes each lagged
state field from `seed` where present and otherwise derives it from `inputs` (defaulting to
`DEFAULT_INPUTS`). It SHALL compute `lastValidOutputs` from the resulting laggeds the same way `step()`
does, so the returned state is internally coherent with the seed on the very first frame. When called
with no arguments (or an empty seed), the returned state SHALL be identical to the prior no-argument
behaviour. The seed only changes *where* the simulation starts; it SHALL NOT alter how `step()` evolves
the state.

#### Scenario: No seed reproduces the default start
- **WHEN** `initialState()` is called with no arguments
- **THEN** the returned state equals the previous hardcoded default (zero field, valve ≈ 93 %, near-synchronous speed) field-for-field

#### Scenario: Seed overrides only named fields and stays coherent
- **WHEN** `initialState(inputs, { iField: 1.0, speedLagged: 1.0 })` is called
- **THEN** `iField` and `speedLagged` take the seeded values, the remaining laggeds derive from `inputs`, and `lastValidOutputs` is solved from the seeded laggeds (no cold-frame mismatch)

#### Scenario: Seeded state evolves under the unchanged step
- **WHEN** a seeded settled state is advanced by `step()`
- **THEN** the physics evolve exactly as they would for the same state reached by settling — no behaviour of `step()` depends on whether the state came from a seed
