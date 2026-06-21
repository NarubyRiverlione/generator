## ADDED Requirements

### Requirement: Application layout — strip + tabbed panel

The application SHALL render two regions side by side:

1. **Status strip** (left, fixed ~160 px wide): always visible, read-only comparison of both generators.
2. **Tabbed panel** (right, remaining width): tab bar on top, full generator panel below for the active generator.

Both generators' simulations SHALL run continuously regardless of which tab is active. The layout
SHALL NOT stack the strip and panel vertically at any supported breakpoint — the strip + panel
arrangement is fixed.

#### Scenario: Strip always visible
- **WHEN** the user switches between GEN 1 and GEN 2 tabs
- **THEN** the status strip remains visible and continues updating for both generators

#### Scenario: Panel switches on tab click
- **WHEN** the user clicks the GEN 1 tab
- **THEN** the full Gen 1 panel is rendered and Gen 1 controls are interactive
- **WHEN** the user clicks the GEN 2 tab
- **THEN** the full Gen 2 panel is rendered and Gen 2 controls are interactive

#### Scenario: Inactive generator keeps simulating
- **WHEN** GEN 2 tab is active and the user operates Gen 2 controls
- **THEN** Gen 1 simulation continues to advance at the same tick rate and its status strip values continue updating

---

### Requirement: Status strip content and layout

The status strip SHALL show two value columns — Gen 1 (left) and Gen 2 (right) — with a shared label
column on the far right. The strip SHALL be approximately 160 px wide total.

Fields displayed, in order:

| Label | Unit | Format |
|---|---|---|
| RPM | rpm | 4 digits, no decimal |
| Hz | Hz | 4 chars, 1 decimal (e.g. 50.0) |
| Vt | V | 3 digits, no decimal |
| P | kW | 4 digits, no decimal |
| BKR | — | Indicator dot: filled = closed, hollow = open |
| AVR | — | Indicator dot: filled = armed/active, hollow = off/inhibited |
| GOV | — | Indicator dot: filled = armed/active, hollow = off/inhibited |

All fields SHALL update continuously as each generator's simulation advances. The strip SHALL contain
no interactive controls — it is read-only.

#### Scenario: Strip reflects live simulation values
- **WHEN** a generator's RPM changes
- **THEN** the corresponding column in the status strip updates within one render cycle

#### Scenario: Breaker indicator matches breaker state
- **WHEN** a generator's load breaker is closed
- **THEN** its BKR dot in the strip is filled
- **WHEN** the breaker is open
- **THEN** its BKR dot is hollow

#### Scenario: AVR indicator reflects arm state
- **WHEN** AVR is enabled and speed is above the arm threshold
- **THEN** the AVR dot is filled
- **WHEN** AVR is off or inhibited by underspeed
- **THEN** the AVR dot is hollow

#### Scenario: GOV indicator reflects arm state
- **WHEN** the governor is enabled and speed is above the arm threshold
- **THEN** the GOV dot is filled
- **WHEN** the governor is off or inhibited
- **THEN** the GOV dot is hollow

---

### Requirement: Tab bar

The tab bar SHALL display two tabs labelled **GEN 1** and **GEN 2**, positioned above the generator
panel. The active tab SHALL be visually distinguished. Clicking an inactive tab SHALL switch the panel.

Keyboard shortcuts: pressing `1` SHALL activate GEN 1; pressing `2` SHALL activate GEN 2. Shortcuts
SHALL NOT fire when the key event originates from a text input or other focusable element.

#### Scenario: Keyboard shortcut switches tabs
- **WHEN** the user presses `1`
- **THEN** the GEN 1 tab becomes active and the Gen 1 panel is shown
- **WHEN** the user presses `2`
- **THEN** the GEN 2 tab becomes active and the Gen 2 panel is shown

#### Scenario: Keyboard shortcut ignored in inputs
- **WHEN** the user presses `1` or `2` while a text input is focused
- **THEN** the active tab does not change

---

### Requirement: Existing panel layout preserved

The full 6-column generator panel (gauges, knobs, switches, LCD, indicator lights) SHALL render
unchanged inside the tab. No modifications to the panel's internal layout, column widths, or
breakpoint behaviour are introduced by this change. The existing responsive breakpoints (960 / 820 /
540 px) apply to the panel region only; the status strip width is fixed and does not participate in
panel breakpoint calculations.

#### Scenario: Panel renders identically in tab
- **WHEN** either generator tab is active
- **THEN** the full 6-column switchboard panel renders with the same layout, dimensions, and behaviour
  as the single-generator panel in Phase 3d
