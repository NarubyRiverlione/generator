# Spec: Turbine Governor

## Purpose

The turbine governor controls the intake valve of the prime mover, translating a spring-return raise/lower speed-changer switch into a valve position that commands mechanical power into the rotor. The valve position maps linearly to mechanical power `Pm`, which drives rotor speed through the swing equation in the simulation core. The internal EMF scales with per-unit rotor speed.

## Requirements

### Requirement: Turbine governor speed-changer and intake valve
The system SHALL command rotor speed indirectly through the turbine's intake valve, not by setting
frequency directly. **Two** spring-return raise/lower speed-changer switches SHALL drive the motor-operated
valve additively: a **fine** switch (existing; slow = 0.5 rpm/s, fast = 5 rpm/s) and a new **coarse**
switch (slow = 10 rpm/s, fast = 25 rpm/s). While either switch is held off neutral the valve **setpoint**
(`valvePct`, 0–100 %) SHALL change at the combined jog rate of both switches and SHALL hold its position
when both return to neutral. Each switch SHALL provide two throw stages — an inner (slow) and an outer
(fast) jog rate in each direction. When `governorOn` is `true`, both switches are bypassed and the
governor commands `valvePct` directly.

The valve setpoint (`valvePct`) represents the governor demand position. The physical valve position
(`valveActual`) lags behind the setpoint through a valve actuator lag (see "Valve actuator lag"
requirement). `valveActual` SHALL map linearly to **mechanical power in** `Pm`: 0 % → 0 pu (fully
closed), with `Pm ≈ 1.0` pu at the rated valve position (~93.75 %) and a small headroom at 100 %.
`Pm` then drives rotor speed through the swing equation (see the simulation-core "Swing-equation rotor
dynamics" requirement); the valve no longer maps to a speed target. The simulation MAY start with the
shaft at rest (`omega = 0`) or pre-spun, depending on the selected start preset.

#### Scenario: Holding raise opens the valve setpoint and lifts mechanical power
- **WHEN** the raise side of either switch is held
- **THEN** `valvePct` increases at that switch's jog rate and, after the valve actuator lag, `Pm` rises, and the rotor accelerates through the swing equation when `Pm > Pe`

#### Scenario: Valve setpoint holds when both switches are released
- **WHEN** both switches return to neutral
- **THEN** `valvePct` stops changing and holds; `valveActual` continues closing the gap toward `valvePct` over the actuator time constant, and `Pm` settles at the corresponding value

#### Scenario: Coarse switch jogs at 2× the fine fast rate
- **WHEN** the coarse fast throw is held versus the fine fast throw for the same time
- **THEN** `valvePct` moves approximately twice as far on the coarse throw

#### Scenario: Both switches contribute additively
- **WHEN** both fine and coarse switches are held in the raise direction simultaneously
- **THEN** `valvePct` rises at the sum of both jog rates

#### Scenario: Fully closed valve commands zero mechanical power
- **WHEN** `valveActual` is 0 %
- **THEN** `Pm` is 0 pu (the valve is physically closed) and the rotor receives no driving power

#### Scenario: Rated mechanical power at ~93.75 % actual valve
- **WHEN** `valveActual` has settled at ~93.75 %
- **THEN** `Pm` is approximately 1.0 pu

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
same exact-exponential form as the field lag. `valveActual` SHALL be clamped to [0, 100].

`valveActual` (not `valvePct`) SHALL drive the mechanical power `Pm`, making the full chain:

```
governor demand → valvePct (setpoint)
               → valve actuator lag (τ_valve = 2.0 s) → valveActual (physical position)
               → Pm = (valveActual / 100) · PM_MAX
               → swing equation (2H · dω/dt = Pm − Pe) → omega → RPM / Hz
```

Both `valvePct` and `valveActual` SHALL be exposed in `Outputs`.

#### Scenario: Valve actual lags setpoint during fast jog
- **WHEN** the fast jog is held and then released
- **THEN** `valveActual` is behind `valvePct`, and after the switch is released `valveActual` continues closing the gap toward `valvePct` over approximately one τ_valve (~2 s)

#### Scenario: Both initialised at the same position
- **WHEN** the simulation initialises from a preset where the valve is open
- **THEN** `valveActual` equals `valvePct` and no initial transient appears on the position indicator

#### Scenario: valveActual drives mechanical power
- **WHEN** `valvePct` changes but `valveActual` has not yet caught up
- **THEN** `Pm` is derived from `valveActual`, and the rotor responds to `valveActual`, not `valvePct`

#### Scenario: Valve actual settles to setpoint after release
- **WHEN** the speed-changer is released (neutral) and sufficient time passes
- **THEN** `valveActual` converges to `valvePct` and the two needles on the `PositionIndicator` align
