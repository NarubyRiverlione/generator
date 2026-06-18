## ADDED Requirements

### Requirement: Start-point preset registry
The simulator SHALL provide a fixed, code-defined registry of named start-point presets, each defined as
`{ inputs: Partial<Inputs>, seed: Partial<SimState> }`, plus a `BOOT_PRESET` const naming the
compile-time default preset (shipping `cold-dark`). The registry SHALL include at least:
- `cold-dark` — fully at rest: zero field, valve closed (`valveActual = 0`, `valveCommand = 0`),
  `speedLagged = 0` (shaft not turning), no load. This is a *deliberate change* from today's boot, not a
  reproduction of it.
- `spinning-dark` — today's literal boot, preserved: shaft pre-spun to ~1495 rpm (`valveActual ≈ 93.4 %`,
  `speedLagged ≈ 0.9967`), zero field (dark, Vt = 0), no load. Its empty seed reproduces the default
  `initialState()` boot field-for-field (the regression anchor).
- `live-loaded` — a settled, loaded islanded operating point: field built up (≈ rated), valve ≈ 93 %,
  near-synchronous speed, and some active load — booting already settled with no multi-second lag wait.

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

### Requirement: URL-selected start point
The simulator SHALL resolve a start-point preset once at startup from the `start` URL query parameter
(e.g. `?start=live-loaded`) and seed both the input knob positions and the simulation state from the
resolved preset. A valid `start` value overrides `BOOT_PRESET`; an unknown or absent value SHALL fall
back to `BOOT_PRESET`. The driver hook SHALL accept the resolved preset (or its name) rather than reading
`window` itself.

#### Scenario: URL parameter selects a preset
- **WHEN** the app loads with `?start=live-loaded`
- **THEN** the inputs and simulation state are seeded from the `live-loaded` preset, so the machine boots already settled at a loaded operating point rather than cold

#### Scenario: Absent or unknown parameter boots BOOT_PRESET
- **WHEN** the app loads with no `start` parameter, or with `?start=bogus`
- **THEN** the simulator boots from `BOOT_PRESET` (`cold-dark` as shipped — fully at rest, which differs from today's pre-spun boot)
