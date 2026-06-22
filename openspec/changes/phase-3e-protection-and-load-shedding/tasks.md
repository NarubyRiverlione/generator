## 1. Constants and types

- [ ] 1.1 Add `RELAY59_TRIP_VT = 1.15`, `RELAY59_PICKUP_S = 0.1`, `RELAY81_TRIP_HZ = 48.5`, `RELAY81_PICKUP_S = 0.5`, `RELAY81_SHED_FRACTION = 0.25` to `src/core/constants.ts`

## 2. Hook — relay logic

- [ ] 2.1 Add pickup timer refs: `relay59PickupRef = useRef<number>(0)`, `relay81PickupRef = useRef<number>(0)`
- [ ] 2.2 Add latch/counter refs: `relay59Ref = useRef<boolean>(false)`, `relay81ShedCountRef = useRef<number>(0)`
- [ ] 2.3 Add React state mirrors: `relay59Tripped` and `setRelay59Tripped`; `relay81ShedCount` and `setRelay81ShedCount`
- [ ] 2.4 In the tick loop: accumulate `relay59PickupRef` when `outputs.vt > RELAY59_TRIP_VT`; reset it when `vt` drops below; trip (set field=0, avrOn=false, latch) when timer ≥ `RELAY59_PICKUP_S`
- [ ] 2.5 In the tick loop: accumulate `relay81PickupRef` when `outputs.frequencyHz < RELAY81_TRIP_HZ` and `loadFraction > 0`; reset it when `Hz` recovers; fire shed (reduce loadFraction, increment count, reset timer) when timer ≥ `RELAY81_PICKUP_S`
- [ ] 2.6 Add `resetRelay59` callback: clears `relay59Ref`, `relay59PickupRef`, and `setRelay59Tripped(false)`
- [ ] 2.7 Expose `relay59Tripped`, `resetRelay59`, `relay81ShedCount` from `SimHook` type and hook return

## 3. App — wiring

- [ ] 3.1 Destructure `relay59Tripped`, `resetRelay59`, `relay81ShedCount` from `useGeneratorSimulation`
- [ ] 3.2 Add second relay dome (59) to the col-4 row-3 relay reset cell; pass `relay59Tripped` and `resetRelay59`
- [ ] 3.3 Pass `relay59Tripped` and `relay81ShedCount` to `StatusDisplay`
- [ ] 3.4 Pass `relay59Tripped` to `IndicatorLights`

## 4. IndicatorLights — 59 RELAY TRIP indicator

- [ ] 4.1 Replace the "Q SUPPLYING" LED row in the bottom half with "59 RELAY TRIP" (red LED when `relay59Tripped`)
- [ ] 4.2 Add `relay59Tripped: boolean` to the `IndicatorLights` Props type

## 5. StatusDisplay — fault screen and LCD

- [ ] 5.1 Add `relay59Tripped: boolean` and `relay81ShedCount: number` to the `StatusDisplay` Props type
- [ ] 5.2 Extend `faultLevel()` (or replace with a priority function) to handle: 59 trip > 27 trip > danger > warn > 81 shed > ok
- [ ] 5.3 Add 59 fault screen JSX: "⚠ 59 RELAY TRIP" / "OVER-VOLTAGE" / "FIELD TRIPPED"
- [ ] 5.4 Add 81 shed advisory JSX: "81 LOAD SHED" / "EVENTS: N"
- [ ] 5.5 Add 81 SHED entry to the sticky reference legend

## 6. Relay reset UI — 59 dome

- [ ] 6.1 Add 59 dome button to the relay reset cell in `App.tsx` (stacked below 27 dome); styled to match the 27 dome pattern
- [ ] 6.2 Ensure the cell label reads clearly with two domes (e.g. "27 · 59 RELAY / RESET")

## 7. Tests

- [ ] 7.1 59 relay: pickup fires after ≥ 100 ms above threshold; does NOT fire when condition clears before 100 ms
- [ ] 7.2 59 relay: trip sets `avrOn = false` and `fieldVoltage = 0` in inputs; `relay59Tripped` becomes true
- [ ] 7.3 59 relay: latch holds after `vt` recovers; reset clears it without restoring field
- [ ] 7.4 81 relay: first shed fires after ≥ 500 ms below 48.5 Hz; does NOT fire when condition clears before 500 ms
- [ ] 7.5 81 relay: each shed reduces `loadFraction` by 0.25, floored at 0; shed count increments
- [ ] 7.6 81 relay: no shed fires when `loadFraction` is already 0

## 8. Docs update (on archive)

- [ ] 8.1 Update `docs/roadmap.md`: mark Stage 3e ✓ complete; reconcile relay thresholds against `constants.ts`
- [ ] 8.2 Update `docs/roadmap.md` Fixed Parameters table: add RELAY59 and RELAY81 rows
