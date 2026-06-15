## ADDED Requirements

### Requirement: Turbine governor speed input
The simulation core SHALL accept rotor speed as an input expressed in Hz (range 47–53, default 50). Internally it SHALL convert this to per-unit speed as `speed_pu = speedHz / 50` and use it to scale the internal EMF: `Ea_pu = field_pu × speed_pu`. The output frequency SHALL be derived as `frequencyHz = 50 × speed_pu`.

#### Scenario: Rated speed produces no change from Phase 1 behaviour
- **WHEN** speedHz is 50 (speed_pu = 1.0)
- **THEN** Eₐ equals field_pu × 1.0, terminal voltage and power match the Phase 1 baseline for the same field and load inputs

#### Scenario: Speed reduction sags terminal voltage
- **WHEN** speedHz is reduced below 50 with AVR off
- **THEN** Ea_pu decreases and the solved terminal voltage Vₜ falls proportionally

#### Scenario: Speed reduction lowers output frequency
- **WHEN** speedHz is set to 47
- **THEN** frequencyHz in SimulatorOutputs is 47 Hz

#### Scenario: Speed increase raises terminal voltage
- **WHEN** speedHz is increased above 50 with AVR off
- **THEN** Ea_pu increases and the solved terminal voltage Vₜ rises

### Requirement: First-order speed lag
Speed changes SHALL be smoothed by a first-order lag with time constant τ_speed = 0.5 s, applied to the speed signal before it scales Eₐ. The lag SHALL be advanced by real elapsed time each simulation step, consistent with the existing field lag mechanism.

#### Scenario: Speed step settles over the time constant
- **WHEN** the speed target is stepped from 50 Hz to 53 Hz and the simulation advances by one τ_speed (~0.5 s)
- **THEN** the lagged speed has moved approximately 63 % of the way toward 53 Hz

#### Scenario: Speed lag is independent of field lag
- **WHEN** both field and speed are stepped simultaneously
- **THEN** each settles at its own time constant (field at ~1.5 s, speed at ~0.5 s) without interference
