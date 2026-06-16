## ADDED Requirements

### Requirement: Voltage stability margin
The machine solver SHALL compute a voltage stability margin (VSM) from the discriminant of the
Vₜ² quadratic and expose it as `stabilityMargin` in `Outputs`, normalised to [0, 1] where 1.0 is
no-load (fully stable) and 0.0 is the PV-nose point (about to collapse). VSM SHALL be defined as
`max(0, D) / D_no_load`, where `D` is the current discriminant and `D_no_load = (9·Eₐ²/Xₛ²)²` is the
discriminant at zero load. It SHALL be computed before the collapse early-return (so a margin is
always reported for a valid operating point) and SHALL be independent of power-factor angle and load
angle. When Eₐ = 0 (and `D_no_load` is therefore 0) the margin SHALL be reported as 0 rather than
dividing by zero.

#### Scenario: Margin is 1.0 at no load
- **WHEN** active load is 0 % with a non-zero field
- **THEN** `stabilityMargin` is 1.0

#### Scenario: Margin falls toward zero approaching collapse
- **WHEN** load increases toward maximum loadability
- **THEN** `stabilityMargin` decreases monotonically toward 0 and reaches ~0 at the nose point

#### Scenario: Margin independent of power factor
- **WHEN** the same active load is applied at different power factors
- **THEN** the reported margin reflects the discriminant only and is not derived from the load angle δ
