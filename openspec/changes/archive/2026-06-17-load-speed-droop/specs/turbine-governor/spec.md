## MODIFIED Requirements

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
