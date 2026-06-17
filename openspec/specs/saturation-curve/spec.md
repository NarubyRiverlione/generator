# Spec: Saturation Curve

## Purpose

Models the non-linear open-circuit characteristic of the synchronous generator, mapping field current to internal EMF through a piecewise-linear curve so that EMF gain per unit of field current falls above the magnetic saturation knee.

## Requirements

### Requirement: Open-circuit saturation characteristic
The core SHALL map field current to internal EMF through a non-linear open-circuit characteristic
implemented as a piecewise-linear curve through the breakpoints (0.0, 0.0), (1.0, 1.0) and (1.5, 1.2),
so that EMF gain per unit of field current falls above the knee at 1.0 pu. This saturated EMF SHALL be
the value scaled by rotor speed before the circuit solve: `Eₐ = saturation(field) × speed_pu`.

#### Scenario: Knee point is exact
- **WHEN** field current is 1.0 pu
- **THEN** the saturation curve returns Eₐ = 1.0 pu

#### Scenario: Ceiling is saturated
- **WHEN** field current is 1.5 pu
- **THEN** the saturation curve returns Eₐ = 1.2 pu (not 1.5)

#### Scenario: Linear interpolation above the knee
- **WHEN** field current is 1.25 pu
- **THEN** the saturation curve returns Eₐ midway between 1.0 and 1.2 (i.e. 1.1 pu)

#### Scenario: Diminishing returns above the knee
- **WHEN** field is raised from 1.0 to 1.5 pu versus from 0.5 to 1.0 pu, at fixed speed and load with AVR off
- **THEN** the terminal-voltage gain from the above-knee increase is smaller than from the below-knee increase
