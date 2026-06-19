## MODIFIED Requirements

### Requirement: Constant-power load model
The core SHALL model the load as constant power. The active-load Knob (0–100 % of rated) and the
power-factor Knob SHALL define the load's active power P and reactive power Q directly, independent of
terminal voltage. Lagging power factor SHALL produce Q > 0 (inductive) and leading power factor SHALL
produce Q < 0 (capacitive).

**When `inputs.loadBreaker` is `false`** (breaker open), the load demand passed to `solveMachine()` and
to `computeLoad()` SHALL be treated as zero (`p = 0`, `q = 0`), regardless of the Knob position. The
Knob value is retained in `Inputs` (it pre-sets the load for the next close) but has no effect on the
solve until the breaker closes.

#### Scenario: Load demand derived from Knob (breaker closed)
- **WHEN** active load is 50 %, power factor is 0.85 lagging, and `loadBreaker` is `true`
- **THEN** the load demand is P = 0.5 pu and Q = 0.5·tan(acos(0.85)) pu with Q positive

#### Scenario: Load disconnected when breaker is open
- **WHEN** `loadBreaker` is `false` regardless of the active-load Knob position
- **THEN** `solveMachine()` is called with `p = 0`, `q = 0`; `Vt` settles to `Ea`; `Pe = 0` in the swing equation

#### Scenario: Leading power factor yields negative Q
- **WHEN** the power factor is set to a leading value and the breaker is closed
- **THEN** the resulting load Q is negative

### Requirement: Saturation-derate and power-balance signals are exported for readout
The simulation core SHALL expose diagnostic signals in `Outputs` so the UI can make the saturation and
rotor-dynamics physics legible:

- `saturationFactor` — the open-circuit derate ratio `saturation(iField) / iField` (dimensionless),
  clamped to `1.0` when `iField ≤ 0`. A value of 1.0 means the field is below the saturation knee
  (no derate); values below 1.0 quantify how much above-knee saturation is eroding EMF gain.
- `pm` — mechanical power in (per-unit), from the valve mapping. Together with the existing active-power
  output `p` (= `Pe`), this lets the UI present the power imbalance `Pm − Pe` that the swing equation
  integrates.
- `dampingTorque` — the instantaneous damper-winding braking torque `D · (ω − ωref)` (per-unit),
  computed from `DAMPING_D * (state.omega - OMEGA_REF)`. Zero at synchronous speed; spikes transiently
  during load steps proportional to slip. This is a passive effect — no sensor, no control loop.

All three SHALL be computed each step and returned alongside the existing outputs.

#### Scenario: Saturation factor is 1.0 below the knee
- **WHEN** the lagged field current is at or below 1.0 pu
- **THEN** `Outputs.saturationFactor` equals 1.0

#### Scenario: Saturation factor falls above the knee
- **WHEN** the lagged field current is above the saturation knee
- **THEN** `Outputs.saturationFactor` is less than 1.0 and equals `saturation(iField) / iField`

#### Scenario: Mechanical power exported for the power balance
- **WHEN** the valve commands a mechanical power `Pm`
- **THEN** `Outputs.pm` equals that `Pm`, and `Outputs.pm − Outputs.p` is the power imbalance the rotor integrates

#### Scenario: Damping torque is zero at synchronous speed
- **WHEN** `omega` equals `OMEGA_REF` (1.0 pu, 1500 rpm)
- **THEN** `Outputs.dampingTorque` is 0

#### Scenario: Damping torque spikes during load step
- **WHEN** the breaker closes onto a load that causes `omega` to drop below `OMEGA_REF`
- **THEN** `Outputs.dampingTorque` is negative (braking becomes negative — the damper is now *assisting* deceleration resistance); its magnitude is proportional to the slip `(omega − OMEGA_REF)`

## ADDED Requirements

### Requirement: Load breaker input
`Inputs` SHALL include a `loadBreaker: boolean` field (default `false`). When `false`, the simulation
core treats load demand as zero (see "Constant-power load model"). When `true`, the full Knob-defined
load is applied. No other simulation state changes — `loadBreaker` is a pure input gate with no lag or
integrator.

#### Scenario: Default inputs have breaker open
- **WHEN** `DEFAULT_INPUTS` is used
- **THEN** `loadBreaker` is `false`

#### Scenario: Breaker transition has no smoothing
- **WHEN** `loadBreaker` changes from `false` to `true` in a single step
- **THEN** `Pe` jumps from 0 to the full Knob-defined value in that step, with no ramp or lag
