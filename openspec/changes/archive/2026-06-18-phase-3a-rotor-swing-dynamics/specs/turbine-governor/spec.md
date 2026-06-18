## MODIFIED Requirements

### Requirement: Turbine governor speed-changer and intake valve
The system SHALL command rotor speed indirectly through the turbine's intake valve, not by setting
frequency directly. A spring-return raise/lower speed-changer switch SHALL drive a motor-operated valve:
while the switch is held off neutral the valve **setpoint** (`valvePct`, 0–100 %) SHALL change at a
jog rate and SHALL hold its position when the switch returns to neutral. The switch SHALL provide two
throw stages — an inner (slow) and an outer (fast) jog rate in each direction.

The valve setpoint (`valvePct`) represents the governor demand position. The physical valve position
(`valveActual`) lags behind the setpoint through a valve actuator lag (see "Valve actuator lag"
requirement). `valveActual` SHALL map linearly to **mechanical power in** `Pm`: 0 % → 0 pu (fully
closed), with `Pm ≈ 1.0` pu at the rated valve position (~93.75 %) and a small headroom at 100 %.
`Pm` then drives rotor speed through the swing equation (see the simulation-core "Swing-equation rotor
dynamics" requirement); the valve no longer maps to a speed target. The simulation MAY start with the
shaft at rest (`omega = 0`) or pre-spun, depending on the selected start preset.

#### Scenario: Holding raise opens the valve setpoint and lifts mechanical power
- **WHEN** the raise side of the switch is held
- **THEN** `valvePct` increases at the jog rate and, after the valve actuator lag, `Pm` rises, and the rotor accelerates through the swing equation when `Pm > Pe`

#### Scenario: Valve setpoint holds when the switch is released
- **WHEN** the switch returns to neutral
- **THEN** `valvePct` stops changing and holds; `valveActual` continues closing the gap toward `valvePct` over the actuator time constant, and `Pm` settles at the corresponding value

#### Scenario: Fast throw jogs faster than slow throw
- **WHEN** the outer (fast) position is held versus the inner (slow) position for the same time
- **THEN** `valvePct` moves a larger amount on the fast throw

#### Scenario: Fully closed valve commands zero mechanical power
- **WHEN** `valveActual` is 0 %
- **THEN** `Pm` is 0 pu (the valve is physically closed) and the rotor receives no driving power

#### Scenario: Rated mechanical power at ~93.75 % actual valve
- **WHEN** `valveActual` has settled at ~93.75 %
- **THEN** `Pm` is approximately 1.0 pu

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

## REMOVED Requirements

### Requirement: Kinematic spin-up lag
**Reason**: Replaced by real rotor dynamics. Rotor speed is now the integral of power imbalance over
inertia (the swing equation), not a first-order lag gliding toward a droop-corrected kinematic target.
The `τ_spinup` time constant and the `Pe × govDroop` droop correction no longer exist; the `2H`
inertia term sets the run-up and response timescale.
**Migration**: See the simulation-core "Swing-equation rotor dynamics" requirement. Remove `TAU_SPINUP`
and the droop-corrected effective-target computation; integrate `omega` from `dω/dt = (Pm − Pe)/2H`
(undamped — no `D` term).
