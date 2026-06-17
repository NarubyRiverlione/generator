## ADDED Requirements

### Requirement: Numerical safety at degenerate operating points
The simulation core SHALL return finite outputs for any finite input set, including startup and
near-singular states where `Ea` and/or `Vt` approach zero. Division-sensitive calculations (including
`delta` and `ia`) SHALL use guarded forms so the solver never emits `NaN` or `Infinity`.

At zero excitation and zero load, the core SHALL treat the operating point as a valid finite rest
state (`collapsed = false`) with `Vt = 0`, `Ia = 0`, and `delta = 0`.

#### Scenario: Zero-excitation rest state remains finite
- **WHEN** field excitation is zero and load demand is zero
- **THEN** the solver returns `Vt = 0`, `Ia = 0`, `delta = 0`, and `collapsed = false` with no non-finite values

#### Scenario: Near-singular loaded state does not emit non-finite values
- **WHEN** excitation and terminal voltage are near zero while load demand is non-zero
- **THEN** the solver reports a valid finite state (typically collapsed/frozen) with no `NaN` or `Infinity` in outputs

### Requirement: Load-demand input sanitization
The simulation core SHALL sanitize load-demand inputs before trigonometric evaluation so invalid caller
inputs cannot corrupt solver state:

- `loadFraction` SHALL be treated as `max(0, value)` for finite values; non-finite values SHALL be treated as `0`
- `powerFactor` magnitude SHALL be clamped to `[0, 1]`; non-finite values SHALL default to `1`
- The lag/lead sign SHALL continue to be determined only by `pfLag`

#### Scenario: Out-of-range power factor is bounded safely
- **WHEN** `powerFactor` is outside `[0, 1]`
- **THEN** demand computation uses the nearest bound and produces finite `P` and `Q`

#### Scenario: Non-finite load input collapses to zero demand
- **WHEN** `loadFraction` is `NaN` or non-finite
- **THEN** demand computation treats active load as `0` and returns finite `P` and `Q`

### Requirement: Lagged field signal is exported for downstream readouts
The simulation core SHALL expose the lagged field signal used in the solver as `Outputs.iField`, and
this value SHALL equal the simulation state's lagged field after each step.

#### Scenario: Exported lagged field tracks field dynamics
- **WHEN** field target changes and the simulation advances in time
- **THEN** `Outputs.iField` follows the configured field lag and converges to the same steady-state as the internal lagged field state

#### Scenario: AVR command and lagged field can diverge transiently
- **WHEN** AVR command changes faster than the field time constant
- **THEN** `Outputs.iField` is distinct from `avrCommand` during transient response and converges afterward
