## MODIFIED Requirements

### Requirement: Swing-equation rotor dynamics
The simulation core SHALL evolve rotor speed `ω` (per-unit, 1.0 = `RPM_RATED`) by integrating the
damped swing equation each step:

```
dω/dt = (Pm − Pe − D·(ω − ωref)) / (2H)
ω ← ω + (dω/dt)·dt        // forward Euler, dt = real elapsed time
```

where `Pm` is mechanical power in (from the valve, see "Valve commands mechanical power"), `Pe` is the
active electrical power output, `H` is the inertia constant (s), `D` is the damping coefficient
`DAMPING_D` (pu), and `ωref = OMEGA_REF = 1.0` is the synchronous reference speed.

`D·(ω − ωref)` represents amortisseur (damper) winding braking: zero at synchronous speed, proportional
viscous drag under any slip. It is a passive electromagnetic effect — no sensor, no control loop. At
steady state `ω = ωref` so `D·(ω − ωref) = 0` and the term has no effect on the isochronous governor's
ability to hold exactly 1500 rpm.

`ω` SHALL be a genuinely integrated state field on `SimState` (named `omega`). `RPM_RATED` and the
readout derivations (`rpm = omega · RPM_RATED`, `frequencyHz = rpm / 30`) are unchanged.

`Pe` SHALL be taken from the previous step's active power output (`state.lastValidOutputs.p`), so the
integration does not depend circularly on the current solve. The one-step delay is negligible at
simulation cadence, and additional `Pe` terms (e.g. a synchronising-power term in a later stage) can be
added to this same expression.

`ω` SHALL be floored at 0 (the rotor cannot spin backwards) and bounded at the existing overspeed
ceiling: when `ω` reaches `VALVE_RPM_MAX / RPM_RATED` (~1.067), the core SHALL clamp `ω` at that ceiling
rather than integrating without limit.

#### Scenario: Surplus mechanical power accelerates the rotor from rest
- **WHEN** `omega` is 0, the load is disconnected (`Pe = 0`), and the valve commands a positive `Pm`
- **THEN** `omega` increases over time (the rotor runs up), and `rpm` rises toward the speed where the net imbalance is zero

#### Scenario: Fixed valve has no reachable stable frequency after a load step
- **WHEN** active load is increased so `Pe > Pm` and the valve is then held fixed (governor off)
- **THEN** `omega` (and hence `rpm`/`frequencyHz`) drifts downward and does not settle at a new steady frequency within the operating band — the operator must raise the valve to rebalance

#### Scenario: Raising the valve rebalances power and arrests the drift
- **WHEN** the operator raises the valve after a load step until `Pm ≈ Pe`
- **THEN** `dω/dt` approaches 0 and `frequencyHz` stops drifting, settling near its current value

#### Scenario: Damping coefficient reduces speed excursion on a load step
- **WHEN** a load step is applied with `DAMPING_D > 0` versus `DAMPING_D = 0`, all else equal
- **THEN** the peak rpm deviation is smaller with `DAMPING_D > 0`, and the transient is arrested faster

#### Scenario: Damping term is zero at synchronous speed
- **WHEN** `omega` equals `OMEGA_REF` (1.0 pu)
- **THEN** the damping contribution `D·(omega − OMEGA_REF)` is 0 and has no effect on steady-state operation

#### Scenario: Overspeed ceiling clamps a runaway rotor
- **WHEN** surplus `Pm` would drive `omega` above `VALVE_RPM_MAX / RPM_RATED`
- **THEN** `omega` is clamped at that ceiling and `rpm` does not exceed `VALVE_RPM_MAX`

#### Scenario: Collapse rejects the load in the swing equation
- **WHEN** the machine solve is collapsed (terminal voltage near zero, no power transfer)
- **THEN** the `Pe` used in the swing equation is 0 (load rejection) rather than a frozen non-zero value, so the rotor accelerates rather than integrating against a phantom load

### Requirement: Inertia parameter
The simulation core SHALL expose an inertia constant `H` (seconds of rated kinetic energy) as a machine
parameter. `H` SHALL be a finite positive number. The swing equation SHALL use the damping coefficient
`DAMPING_D` (see "Damping coefficient") as a viscous-drag term proportional to slip. Setting
`DAMPING_D = 0` recovers the undamped pure-integrator behaviour.

#### Scenario: Inertia parameter present
- **WHEN** the simulation is initialised
- **THEN** the inertia constant `H` is a finite positive number

## ADDED Requirements

### Requirement: Damping coefficient
The simulation core SHALL define a named constant `DAMPING_D` in `src/core/constants.ts` representing
the per-unit damping coefficient for the swing equation. `DAMPING_D` SHALL be a non-negative number.
The default value SHALL be `0.05`. A value of `0` disables damping and restores the undamped swing
equation.

#### Scenario: Damping constant exported from constants
- **WHEN** `DAMPING_D` is imported from `constants.ts`
- **THEN** it is a number equal to `0.05` (the default starting value)

#### Scenario: Zero damping restores pure-integrator behaviour
- **WHEN** `DAMPING_D` is set to `0` and a constant power imbalance is held with governor off
- **THEN** `omega` changes at an approximately constant rate `(Pm − Pe)/(2H)` with no overshoot or ringing — identical to the pre-damping behaviour
