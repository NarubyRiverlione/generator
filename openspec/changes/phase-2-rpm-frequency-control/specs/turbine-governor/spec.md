## ADDED Requirements

### Requirement: Turbine governor speed-changer and fine valve
The system SHALL command rotor speed indirectly through the turbine's **fine** governor valve, not by
setting frequency directly. A spring-return raise/lower speed-changer switch SHALL drive a
motor-operated fine valve: while the switch is held off neutral the fine-valve position (0–100 %) SHALL
change at a jog rate and SHALL hold its position when the switch returns to neutral. The switch SHALL
provide two throw stages — an inner (slow) and an outer (fast) jog rate in each direction. Fine-valve
position SHALL map linearly to a target rotor speed across the governable band: 0 % → 47 Hz (1410 rpm),
50 % → 50 Hz (1500 rpm), 100 % → 53 Hz (1590 rpm). The 0 % position is the low end of the governable
band, NOT a closed valve: base rotor speed is held by the coarse throttle valve (deferred to Phase 3;
assumed at run speed here), so the machine starts already running at 1500 rpm and never falls to 0 rpm
in this phase.

#### Scenario: Holding raise opens the valve and lifts speed
- **WHEN** the raise side of the switch is held
- **THEN** valve position increases at the jog rate and, after the spin-up lag, rotor speed (RPM and Hz) rises toward the valve's target

#### Scenario: Valve holds when the switch is released
- **WHEN** the switch returns to neutral
- **THEN** valve position stops changing and holds, and rotor speed settles at the corresponding target

#### Scenario: Fast throw jogs faster than slow throw
- **WHEN** the outer (fast) position is held versus the inner (slow) position for the same time
- **THEN** the valve moves a larger amount on the fast throw

#### Scenario: Nominal valve is rated speed
- **WHEN** valve position is 50 %
- **THEN** the target rotor speed is 1500 rpm / 50 Hz, matching the Phase 1 baseline for the same field and load

### Requirement: Kinematic spin-up lag
Rotor speed SHALL follow the valve-implied target through a first-order spin-up lag with time constant
τ_spinup = 2.5 s, advanced by real elapsed time each step using the same exact-exponential form as the
field lag. The lag SHALL be independent of the exciter field lag. Speed SHALL NOT be derived from a
power-balance / swing-equation integration in this phase.

#### Scenario: Speed trails the valve over the spin-up time constant
- **WHEN** the valve target is stepped and the simulation advances by one τ_spinup (~2.5 s)
- **THEN** the lagged rotor speed has moved approximately 63 % of the way toward the new target

#### Scenario: Spin-up lag is independent of the field lag
- **WHEN** both the valve and the field target are stepped simultaneously
- **THEN** speed settles on τ_spinup (~2.5 s) and the field settles on the field lag (~1.5 s) without interference

### Requirement: Internal EMF scales with speed
The internal EMF SHALL be scaled by per-unit rotor speed before the circuit solve:
`Eₐ_pu = field_pu × speed_pu`, where `speed_pu = speedHz / 50`. A speed change SHALL therefore move
terminal voltage as well as frequency.

#### Scenario: Speed reduction sags terminal voltage
- **WHEN** the valve (hence speed_pu) is reduced with AVR off and a non-zero field
- **THEN** Eₐ_pu decreases and the solved terminal voltage Vₜ falls

#### Scenario: Speed increase raises terminal voltage
- **WHEN** the valve (hence speed_pu) is increased with AVR off
- **THEN** Eₐ_pu increases and the solved terminal voltage Vₜ rises
