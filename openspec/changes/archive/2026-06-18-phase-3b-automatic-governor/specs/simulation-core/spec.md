## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Isochronous governor PI regulation
The core SHALL provide an optional isochronous governor implemented as a PI controller acting on the
speed error `(ωref − ω)` and commanding the valve setpoint (`valvePct`, %) directly. The governor
SHALL be implemented in a dedicated `governor.ts` file mirroring the structure of `avr.ts`, with a
function `stepGovernor(omegaRef, omega, integralIn, kp, ki, dt) → { command, integral }`.

The governor SHALL be gated by `inputs.governorOn` (default `false`). The PI integral and command
SHALL carry the same anti-windup logic as the AVR: freeze the integral when the command is clamped and
the unsaturated-raw error would deepen the saturation. The command SHALL be clamped to `[0, 100]`
(valve percent). Fixed gains `GOV_KP` and `GOV_KI` and the reference constant `OMEGA_REF = 1.0` SHALL
be defined in `constants.ts`.

When `governorOn` is `true`:
- The governor drives `valvePct` for this step; the valve jog from `inputs.valveCommand` is bypassed.
- Bumpless transfer on engage: the integrator SHALL be primed so the governor output equals the current
  `valvePct` at the moment of engagement:
  `integral = (current_valvePct − GOV_KP × error) / GOV_KI`.

When `governorOn` is `false`, `valvePct` evolves from the manual jog path as before.

`governorIntegral` SHALL be carried in `SimState`. `governorCommand` (the clamped valve % commanded by
the governor, equal to `inputs.valveCommand`-derived `valvePct` when governor is off) SHALL be exposed
in `Outputs`.

#### Scenario: Governor holds frequency under load increase
- **WHEN** active load increases with the governor enabled
- **THEN** `valvePct` rises automatically, `Pm` tracks `Pe`, and `frequencyHz` returns to 50 Hz

#### Scenario: Governor is off — manual jog works unchanged
- **WHEN** `governorOn` is `false`
- **THEN** `valvePct` evolves from the speed-changer jog input exactly as in Stage 3a

#### Scenario: Bumpless transfer on governor engage
- **WHEN** the governor is switched on while the machine is running with a non-zero valve position
- **THEN** `valvePct` does not jump on the first governor step — the first commanded value equals the current valve position

#### Scenario: Governor command clamped at valve ceiling
- **WHEN** speed error is large enough to demand more than 100 % valve opening
- **THEN** `governorCommand` is clamped at 100 and the integrator is frozen (anti-windup)

#### Scenario: Manual jog bypassed when governor is on
- **WHEN** `governorOn` is `true` and `inputs.valveCommand` is non-zero
- **THEN** the governor's PI output drives `valvePct`; the jog input has no effect

#### Scenario: Default gains provide stable response
- **WHEN** `GOV_KP` and `GOV_KI` are at their defaults and a step load increase is applied
- **THEN** `frequencyHz` recovers to 50 Hz without sustained oscillation
