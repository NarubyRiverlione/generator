# Spec: Turbine Governor

## Purpose

The turbine governor controls the intake valve of the prime mover, translating a spring-return raise/lower speed-changer switch into a valve position that determines rotor speed target. It applies a kinematic spin-up lag to model the rotational inertia of the shaft, and scales the internal EMF with per-unit rotor speed.

## Requirements

### Requirement: Turbine governor speed-changer and intake valve
The system SHALL command rotor speed indirectly through the turbine's intake valve, not by setting
frequency directly. A spring-return raise/lower speed-changer switch SHALL drive a motor-operated valve:
while the switch is held off neutral the valve **setpoint** (`valvePct`, 0–100 %) SHALL change at a
jog rate and SHALL hold its position when the switch returns to neutral. The switch SHALL provide two
throw stages — an inner (slow) and an outer (fast) jog rate in each direction.

The valve setpoint (`valvePct`) represents the governor demand position. The physical valve position
(`valveActual`) lags behind the setpoint through a valve actuator lag (see "Valve actuator lag"
requirement). `valveActual` SHALL map linearly to a target RPM: 0 % → 0 rpm (fully closed), 100 % →
1600 rpm (overspeed trip point, ~107 % of rated). Rated speed (1500 rpm / 50 Hz) occurs at
~93.75 % valve. The simulation SHALL start with both setpoint and actual pre-set at ~93.1 %
(giving ~1495 rpm — slightly sub-synchronous).

#### Scenario: Holding raise opens the valve setpoint and lifts speed
- **WHEN** the raise side of the switch is held
- **THEN** `valvePct` increases at the jog rate and, after the valve actuator lag and spin-up lag, rotor speed (RPM and Hz) rises toward the physical valve's target

#### Scenario: Valve setpoint holds when the switch is released
- **WHEN** the switch returns to neutral
- **THEN** `valvePct` stops changing and holds; `valveActual` continues closing the gap toward `valvePct` over the actuator time constant, and rotor speed then settles at the corresponding target

#### Scenario: Fast throw jogs faster than slow throw
- **WHEN** the outer (fast) position is held versus the inner (slow) position for the same time
- **THEN** `valvePct` moves a larger amount on the fast throw

#### Scenario: Fully closed valve targets zero speed
- **WHEN** `valveActual` is 0 %
- **THEN** the target rotor speed is 0 rpm / 0 Hz (the valve is physically closed)

#### Scenario: Rated speed at ~93.75 % actual valve
- **WHEN** `valveActual` has settled at ~93.75 %
- **THEN** the target rotor speed is 1500 rpm / 50 Hz

### Requirement: Kinematic spin-up lag
Rotor speed SHALL follow a droop-corrected effective target through a first-order spin-up lag with
time constant τ_spinup = 2.5 s, advanced by real elapsed time each step using the same exact-exponential
form as the field lag. The lag SHALL be independent of the exciter field lag.

The effective speed target SHALL be:
```
effectiveTarget = speedTarget_pu − Pe_prev × govDroop
```
where `speedTarget_pu = (valveActual / 100) × VALVE_RPM_MAX / RPM_RATED` and `Pe_prev` is the
active power output from the previous simulation step. At zero load `Pe_prev = 0` and the model
reduces to the previous kinematic-only behaviour.

Speed SHALL use this corrected first-order lag rather than a full power-balance / swing-equation
integration.

#### Scenario: Speed trails the valve over the spin-up time constant at no load
- **WHEN** the valve target is stepped with zero active load and the simulation advances by one τ_spinup (~2.5 s)
- **THEN** the lagged rotor speed has moved approximately 63 % of the way toward the new kinematic target

#### Scenario: Spin-up lag is independent of the field lag
- **WHEN** both the valve and the field target are stepped simultaneously with zero load
- **THEN** speed settles on τ_spinup (~2.5 s) and the field settles on the field lag (~1.5 s) without interference

#### Scenario: Load reduces settled speed at fixed valve
- **WHEN** active load is applied while the valve is held fixed
- **THEN** the settled rotor speed is lower than the kinematic target by approximately `Pe × govDroop` pu

### Requirement: Internal EMF scales with speed
The internal EMF SHALL be scaled by per-unit rotor speed before the circuit solve:
`Eₐ_pu = field_pu × speed_pu`, where `speed_pu = rpm / 1500`. A speed change SHALL therefore move
terminal voltage as well as frequency.

#### Scenario: Speed reduction sags terminal voltage
- **WHEN** the valve (hence speed_pu) is reduced with AVR off and a non-zero field
- **THEN** Eₐ_pu decreases and the solved terminal voltage Vₜ falls

#### Scenario: Speed increase raises terminal voltage
- **WHEN** the valve (hence speed_pu) is increased with AVR off
- **THEN** Eₐ_pu increases and the solved terminal voltage Vₜ rises

### Requirement: Valve actuator lag
The physical valve position (`valveActual`) SHALL follow the valve setpoint (`valvePct`) through a
first-order lag with time constant τ_valve = 2.0 s, advanced by real elapsed time each step using the
same exact-exponential form as the field lag and spin-up lag. `valveActual` SHALL be clamped to [0, 100].

`valveActual` (not `valvePct`) SHALL drive the RPM target, making the full lag chain:

```
governor demand → valvePct (setpoint)
               → valve actuator lag (τ_valve = 2.0 s) → valveActual (physical position)
               → rpmTarget → spin-up lag (τ_spinup = 2.5 s) → speedLagged → RPM / Hz
```

Both `valvePct` and `valveActual` SHALL be exposed in `Outputs`.

#### Scenario: Valve actual lags setpoint during fast jog
- **WHEN** the fast jog is held and then released
- **THEN** `valveActual` is behind `valvePct`, and after the switch is released `valveActual` continues closing the gap toward `valvePct` over approximately one τ_valve (~2 s)

#### Scenario: Both initialised at the same position
- **WHEN** the simulation initialises
- **THEN** `valveActual` equals `valvePct` (≈ 93.44 %) and no initial transient appears on the position indicator

#### Scenario: valveActual drives RPM target
- **WHEN** `valvePct` changes but `valveActual` has not yet caught up
- **THEN** `rpmTarget` is derived from `valveActual`, and shaft speed follows `valveActual`, not `valvePct`

#### Scenario: Valve actual settles to setpoint after release
- **WHEN** the speed-changer is released (neutral) and sufficient time passes
- **THEN** `valveActual` converges to `valvePct` and the two needles on the `PositionIndicator` align
