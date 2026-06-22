## ADDED Requirements

### Requirement: ANSI-59 relay reset control
The panel SHALL include an ANSI-59 relay reset dome control in the same col-4 row-3 cell as the
existing ANSI-27 dome. The 59 dome SHALL be visually lit (red) and clickable when `relay59Tripped`
is true; unlit and non-interactive otherwise. Clicking the lit dome SHALL call `resetRelay59()`.
Both domes SHALL be labelled (27 above, 59 below) with a shared RESET label for the group.

#### Scenario: 59 dome lit when relay tripped
- **WHEN** `relay59Tripped` is true
- **THEN** the 59 dome appears lit (red) and is clickable

#### Scenario: 59 dome unlit when relay clear
- **WHEN** `relay59Tripped` is false
- **THEN** the 59 dome appears unlit and is not interactive

#### Scenario: Clicking 59 dome calls reset
- **WHEN** the 59 dome is lit and the user clicks it
- **THEN** `resetRelay59()` is called and the dome becomes unlit

### Requirement: ANSI-59 indicator light
The bottom indicator block SHALL replace the "Q SUPPLYING" LED row with a "59 RELAY TRIP" LED row.
The LED SHALL be red when `relay59Tripped` is true, unlit otherwise. Q supplying state remains
visible on the LCD Q tile.

#### Scenario: 59 trip LED lights on relay trip
- **WHEN** `relay59Tripped` is true
- **THEN** the "59 RELAY TRIP" indicator LED is red

#### Scenario: 59 trip LED unlit when relay clear
- **WHEN** `relay59Tripped` is false
- **THEN** the "59 RELAY TRIP" indicator LED is unlit

### Requirement: Fault screen extended for 59 and 81 events
The LCD fault screen SHALL extend its priority hierarchy to:

1. **59 RELAY TRIP** (highest) — shown when `relay59Tripped` is true; message: "⚠ 59 RELAY TRIP" /
   "OVER-VOLTAGE" / "FIELD TRIPPED".
2. **27 RELAY TRIP** — existing level; message unchanged.
3. **STABILITY DANGER** — existing level.
4. **STABILITY WARNING** — existing level.
5. **81 SHED EVENT** (advisory) — shown when `relay81ShedCount > 0` and no higher fault is active;
   message: "81 LOAD SHED" / "EVENTS: N" where N is the count.
6. **ALL CLEAR** — shown when no fault or advisory is active.

#### Scenario: 59 fault screen shown when relay tripped
- **WHEN** `relay59Tripped` is true
- **THEN** the fault screen shows the 59 relay trip message regardless of other conditions

#### Scenario: 81 advisory shown when shed events occurred and no fault active
- **WHEN** `relay81ShedCount > 0` and no relay trip or stability warning is active
- **THEN** the fault screen shows the 81 load shed advisory with the event count

#### Scenario: 59 takes priority over 27 if both tripped
- **WHEN** both `relay59Tripped` and `relay27Tripped` are true simultaneously
- **THEN** the fault screen shows the 59 message (higher priority)

#### Scenario: 81 advisory suppressed when fault active
- **WHEN** `relay81ShedCount > 0` and `relay27Tripped` is also true
- **THEN** the fault screen shows the 27 relay trip message, not the 81 advisory

### Requirement: LCD legend updated for relay readouts
The sticky reference legend SHALL include entries for:
- The 81 load-shed event count tile: "81 SHED — number of load-shed events fired by the under-frequency relay"
- The 59 relay state: covered by the indicator light label, not a separate legend entry

#### Scenario: Legend includes 81 shed entry
- **WHEN** the user opens the LCD reference legend
- **THEN** it includes an entry explaining the 81 load-shed event count

### Requirement: SimHook exposes relay-59 and relay-81 state
The `SimHook` type returned by `useGeneratorSimulation` SHALL expose:
- `relay59Tripped: boolean`
- `resetRelay59: () => void`
- `relay81ShedCount: number`

`App.tsx` SHALL pass `relay59Tripped` and `resetRelay59` to the relay reset cell, and
`relay59Tripped` + `relay81ShedCount` to `StatusDisplay` and `IndicatorLights`.

#### Scenario: Hook exposes relay-59 state
- **WHEN** `useGeneratorSimulation` is called
- **THEN** the returned object includes `relay59Tripped`, `resetRelay59`, and `relay81ShedCount`
