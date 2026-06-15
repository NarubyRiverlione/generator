## ADDED Requirements

### Requirement: Exciter signal-chain readouts
The system SHALL derive three exciter-chain readouts — exciter AC output (V), rectified DC to the field windings (V), and main rotor field current (A) — as fixed-ratio cascaded gains applied to the lagged exciter field signal. Because the lag is applied once at the field input and the ratios are constant, all three readouts SHALL move together as the field settles.

#### Scenario: All three readouts move when field DC changes
- **WHEN** the exciter field DC input changes and the simulation settles
- **THEN** the exciter AC output, the rectified DC, and the main field current all change in the same direction and reach their new values together

#### Scenario: Readouts settle on the field time constant
- **WHEN** the exciter field DC is stepped
- **THEN** the three readouts settle over the exciter time constant (~1.5 s), tracking the lagged field signal rather than jumping instantly

### Requirement: Chain values are derived, not independent inputs
The exciter-chain readouts SHALL be pure derived functions of the single lagged field signal with no independent state of their own, so the chain cannot diverge from the field current that drives the machine EMF.

#### Scenario: Chain consistent with machine EMF
- **WHEN** the field signal has any value
- **THEN** the displayed main field current is consistent with the field current the core uses to compute the internal EMF Eₐ
