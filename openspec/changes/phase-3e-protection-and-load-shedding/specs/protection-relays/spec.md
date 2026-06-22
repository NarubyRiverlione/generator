## ADDED Requirements

### Requirement: ANSI-59 overvoltage relay — pickup and trip
The simulation hook SHALL implement an ANSI-59 overvoltage relay that monitors `Outputs.vt` each
tick. When `vt` exceeds `RELAY59_TRIP_VT` (1.15 pu / ~460 V), a pickup timer SHALL accumulate elapsed
time. If the condition persists for `RELAY59_PICKUP_S` (0.1 s), the relay SHALL trip. On trip the hook
SHALL immediately:

1. Set `inputs.avrOn = false` (removes AVR authority from the field).
2. Set `inputs.fieldVoltage = 0` (clears excitation command).
3. Set `relay59Tripped = true` (latches).

The pickup timer SHALL reset to zero whenever `vt` drops back below the threshold (condition must be
sustained, not instantaneous).

The relay SHALL latch after a trip — it does NOT self-reset when `vt` returns to normal. The user
must click the 59 reset control to clear the latch. After reset, the pickup timer is cleared and the
relay is immediately available to fire again.

#### Scenario: Relay trips after sustained overvoltage
- **WHEN** `Outputs.vt` exceeds 1.15 pu continuously for ≥ 100 ms
- **THEN** the relay trips: `avrOn` becomes false, `fieldVoltage` becomes 0, `relay59Tripped` becomes true

#### Scenario: No nuisance trip on brief voltage spike
- **WHEN** `Outputs.vt` exceeds 1.15 pu for less than 100 ms (e.g. a momentary transient) then drops below
- **THEN** the relay does NOT trip and the pickup timer resets

#### Scenario: Trip overrides AVR
- **WHEN** AVR is active (controlling field) at the moment the 59 trips
- **THEN** `avrOn` is forced false alongside `fieldVoltage = 0` so the AVR no longer commands excitation

#### Scenario: Relay latches after trip
- **WHEN** the relay has tripped and `vt` subsequently returns below the threshold
- **THEN** `relay59Tripped` remains true and the field remains at 0 until the user resets

#### Scenario: Reset clears latch
- **WHEN** the user activates the 59 reset control
- **THEN** `relay59Tripped` becomes false and the pickup timer is cleared; field and AVR remain at their current (operator-set) values — the relay does not restore them

### Requirement: ANSI-81 under-frequency relay — repeatable load shedding
The simulation hook SHALL implement an ANSI-81 under-frequency relay that monitors `Outputs.frequencyHz`
each tick. When `frequencyHz` falls below `RELAY81_TRIP_HZ` (48.5 Hz), a pickup timer SHALL accumulate
elapsed time. If the condition persists for `RELAY81_PICKUP_S` (0.5 s), the relay SHALL fire one load-shed
event:

1. Reduce `inputs.loadFraction` by `RELAY81_SHED_FRACTION` (0.25), clamped to a floor of 0.
2. Increment an internal shed-event counter (`relay81ShedCount`).
3. Reset the pickup timer to zero.

The relay SHALL NOT latch — after resetting the pickup timer it is immediately available to fire again
if frequency remains below the threshold. This allows multiple sequential shed events if a single shed
step is insufficient to restore frequency.

Shedding SHALL stop automatically when `loadFraction` reaches 0 (no further load to shed) even if
frequency is still below threshold.

#### Scenario: Single shed event after sustained under-frequency
- **WHEN** `Outputs.frequencyHz` remains below 48.5 Hz for ≥ 500 ms
- **THEN** `loadFraction` is reduced by 0.25 (floored at 0) and `relay81ShedCount` increments by 1

#### Scenario: No nuisance shed on brief frequency dip
- **WHEN** `Outputs.frequencyHz` drops below 48.5 Hz for less than 500 ms then recovers
- **THEN** no load is shed and the pickup timer resets

#### Scenario: Multiple sequential sheds while frequency stays low
- **WHEN** one shed event fires and frequency remains below 48.5 Hz
- **THEN** another pickup begins immediately; after another 500 ms a second shed fires

#### Scenario: Shed stops at zero load
- **WHEN** `loadFraction` is already 0 and frequency is below threshold
- **THEN** no further shed events fire (nothing left to shed)

#### Scenario: Shed count accumulates across events
- **WHEN** three sequential shed events have fired
- **THEN** `relay81ShedCount` equals 3

### Requirement: Relay pickup timer accuracy
Both relay pickup timers SHALL use the same `dt` value available in the simulation tick loop. Timers
SHALL NOT use wall-clock `Date.now()` — they must track simulation time so the behaviour is
frame-rate independent.

#### Scenario: Timer is frame-rate independent
- **WHEN** the simulation runs at variable frame rates (20 ms vs 50 ms dt)
- **THEN** the 59 relay trips after the same number of simulated seconds regardless of frame rate
