## MODIFIED Requirements

### Requirement: Valve actuator lag
The physical valve position (`valveActual`) SHALL follow the valve setpoint (`valvePct`) through a
first-order lag with time constant `τ_valve = 0.3 s` (revised from 2.0 s to reflect a diesel fuel rack
rather than a steam intake valve), advanced by real elapsed time each step using the same
exact-exponential form as the field lag. `valveActual` SHALL be clamped to [0, 100].

`valveActual` (not `valvePct`) SHALL drive the mechanical power `Pm`, making the full chain:

```
governor demand → valvePct (setpoint)
               → valve actuator lag (τ_valve = 0.3 s) → valveActual (physical position)
               → Pm = (valveActual / 100) · PM_MAX
               → swing equation (2H · dω/dt = Pm − Pe) → omega → RPM / Hz
```

Both `valvePct` and `valveActual` SHALL be exposed in `Outputs`.

#### Scenario: Valve actual follows setpoint with ~0.3 s lag
- **WHEN** the valve setpoint steps from 0 % to 100 %
- **THEN** `valveActual` reaches ~63 % (one time-constant) in approximately 0.3 s of simulated time

#### Scenario: Valve actual is clamped to [0, 100]
- **WHEN** the governor or jog would drive the setpoint outside [0, 100]
- **THEN** `valveActual` is clamped and never exceeds 100 or goes below 0

#### Scenario: Governor recovery is faster with shorter valve lag
- **WHEN** a load step is applied with the governor enabled
- **THEN** `valveActual` tracks the governor demand noticeably faster than the 2.0 s steam-plant behaviour, and frequency recovers within a few seconds
