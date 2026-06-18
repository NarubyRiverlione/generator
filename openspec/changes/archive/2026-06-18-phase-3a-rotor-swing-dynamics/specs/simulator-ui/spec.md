## MODIFIED Requirements

### Requirement: LCD saturation and power-balance readouts
The LCD SHALL display diagnostic signals exported by the simulation core as numeric values, so a learner
can see the saturation and rotor-dynamics physics directly:

- the **saturation derate** — derived from `Outputs.saturationFactor` (e.g. shown as a percentage; 100 %
  = unsaturated, below 100 % when the field is pushed above the knee), and
- the **power balance** — the mechanical-vs-electrical power imbalance `Outputs.pm − Outputs.p`
  (`Pm − Pe`, pu or kW), the quantity the swing equation integrates: positive accelerates the rotor,
  negative decelerates it, zero holds frequency. This replaces the former load-droop RPM readout (no
  droop model remains).

These occupy the LCD slot previously used by the valve-position line (the valve retains its dedicated
position indicator). The reference legend / sticky note SHALL describe both values.

#### Scenario: Saturation derate shown on LCD
- **WHEN** the field is driven above the saturation knee
- **THEN** the LCD saturation-derate readout shows a value below 100 % consistent with `Outputs.saturationFactor`

#### Scenario: Power balance shown on LCD
- **WHEN** the load draws more active power than the valve commands (`Pe > Pm`)
- **THEN** the LCD power-balance readout shows a negative imbalance consistent with `Outputs.pm − Outputs.p`, and reads ≈ 0 when the operator has rebalanced `Pm ≈ Pe`

#### Scenario: Legend describes the readouts
- **WHEN** the user opens the LCD reference legend
- **THEN** it includes entries explaining the saturation-derate and power-balance readouts

### Requirement: Start-point preset registry
The simulator SHALL provide a fixed, code-defined registry of named start-point presets, each defined as
`{ inputs: Partial<Inputs>, seed: Partial<SimState> }`, plus a `BOOT_PRESET` const naming the
compile-time default preset (shipping `cold-dark`). The registry SHALL include at least:
- `cold-dark` — fully at rest: zero field, valve closed (`valveActual = 0`, `valveCommand = 0`),
  `omega = 0` (shaft not turning), no load. This is the deliberate cold-start point from which the
  operator runs the shaft up under the swing equation.
- `spinning-dark` — shaft pre-spun to ~1495 rpm (`valveActual ≈ 93.4 %`, `omega ≈ 0.9967`), zero field
  (dark, Vt = 0), no load. Its empty seed reproduces the default `initialState()` boot field-for-field
  (the regression anchor).
- `live-loaded` — a settled, loaded islanded operating point: field built up (≈ rated), valve ≈ 93 %,
  near-synchronous speed (`omega ≈ 1.0`), and some active load — booting already settled with no
  multi-second run-up wait.

A `resolvePreset(name?)` helper SHALL return the named preset, or `BOOT_PRESET` when the name is missing
or unrecognised.

#### Scenario: Known preset resolves to its definition
- **WHEN** `resolvePreset('live-loaded')` is called
- **THEN** it returns the `live-loaded` preset with its `inputs` and settled `seed`

#### Scenario: spinning-dark reproduces today's boot
- **WHEN** the state seeded from the `spinning-dark` preset is compared to no-argument `initialState()`
- **THEN** they are field-for-field identical

#### Scenario: Unknown or missing name falls back to BOOT_PRESET
- **WHEN** `resolvePreset(undefined)` or `resolvePreset('does-not-exist')` is called
- **THEN** it returns the `BOOT_PRESET` preset (`cold-dark` as shipped)
