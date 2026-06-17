## ADDED Requirements

### Requirement: Twin-needle position indicator component
The UI SHALL provide a `PositionIndicator` component that accepts a `setpoint` and an `actual` numeric value (same units, same range) and displays them as two distinct needles on a 270° SVG arc inside a circular bezel. The bezel SHALL fit within a 138px wide `gauge-col` column with no layout changes to the switchboard grid.

#### Scenario: Both needles render at correct positions
- **WHEN** `PositionIndicator` is rendered with a given `setpoint` and `actual`
- **THEN** the setpoint needle points to the arc position corresponding to `setpoint` and the actual needle points to the position corresponding to `actual`

#### Scenario: Needles are visually distinguishable
- **WHEN** `PositionIndicator` is rendered with `setpoint !== actual`
- **THEN** the actual needle is bold and black and the setpoint needle is thin and red with an open chevron tip, making the gap between them immediately readable

#### Scenario: Needles overlap when values are equal
- **WHEN** `setpoint === actual`
- **THEN** both needles coincide; the actual needle (drawn on top) remains fully visible

### Requirement: Circular bezel
The dial bezel SHALL be circular (`border-radius: 50%`) on a true square bounding box, visually distinct from the square `sq-bezel` gauges while using the same padding and dark background treatment.

#### Scenario: Bezel renders as a circle
- **WHEN** `ValveDial` is rendered
- **THEN** the bezel appears as a circle inscribed in the 138px column width, not a rounded rectangle

### Requirement: 270° arc with tick marks
The arc SHALL sweep 270°, with the 90° dead zone at the bottom. Tick marks SHALL appear at 0%, 25%, 50%, 75%, and 100% of the arc sweep, each labelled with its percentage value.

#### Scenario: Arc and ticks render correctly
- **WHEN** `ValveDial` is rendered
- **THEN** five evenly-spaced tick marks with labels appear on the arc from the 7 o'clock to 5 o'clock positions

### Requirement: No external charting library
The `PositionIndicator` component SHALL be hand-rolled SVG with no external chart or gauge library dependency, consistent with the existing `Gauge` component.

#### Scenario: Bundle contains no new chart dependency
- **WHEN** the project is built
- **THEN** no new charting or gauge library is added to `package.json`
