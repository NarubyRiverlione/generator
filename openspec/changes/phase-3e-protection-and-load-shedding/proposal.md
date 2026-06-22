## Why

Stage 3d showed the operator what happens when a large load arrives suddenly — now the complement:
what happens when it leaves, and what happens when the machine can't keep up. Load rejection causes
an instantaneous voltage and frequency spike (the field is still fully excited, but Pe drops to zero);
sustained frequency underload risks a blackout. Both need automatic protection, and the tug's electrical
system already has the relays — the sim doesn't model them yet.

## What Changes

- **ANSI-59 overvoltage relay**: trips the field (sets `fieldVoltage` to 0) when `Vt` exceeds the
  trip threshold (1.15 pu) for a configurable pickup time (~100 ms). Load rejection is the primary
  trigger: breaker opens → Pe → 0 → rotor accelerates → Vt spikes. The relay latches and requires
  manual reset (same pattern as the existing ANSI-27).
- **ANSI-81 under-frequency relay**: when `Hz` falls below 48.5 Hz for a short pickup time (~500 ms),
  the ship's load management system sheds the non-essential load fraction, stepping `loadFraction`
  down by a fixed amount (e.g. 25 % of rated). Represents the ship LMS shedding a non-essential
  consumer (hotel HVAC, galley). Repeatable if frequency keeps falling.
- **Indicator panel and LCD**: both relays get armed/tripped indicators alongside the existing ANSI-27
  indicator; the LCD gets trip-event annotations (flashing tile or status line) so the operator can
  follow the sequence.
- **Relay reset UI**: ANSI-59 reset button added beside the existing ANSI-27 dome (same row 3 col 4
  slot, or a second dome in that cell).

## Capabilities

### New Capabilities
- `protection-relays`: ANSI-59 overvoltage relay and ANSI-81 under-frequency relay — trip logic,
  latch/reset, pickup timers, and thresholds. Sits alongside the existing ANSI-27 logic.

### Modified Capabilities
- `simulator-ui`: new relay indicators and reset controls; LCD trip annotations; load-shedding
  event visible in the status display.

## Impact

- `src/core/constants.ts` — new relay thresholds (`RELAY59_TRIP_VT`, `RELAY81_TRIP_HZ`,
  `RELAY59_PICKUP_S`, `RELAY81_PICKUP_S`) and load-shed step size (`RELAY81_SHED_FRACTION`)
- `src/core/types.ts` — relay state added to `SimState` (pickup timers for 59 and 81)
- `src/core/simulation.ts` — relay pickup/trip logic evaluated each tick; 59 clamps field to 0
  when tripped; 81 reduces `loadFraction` by one shed step when tripped
- `src/hooks/useGeneratorSimulation.ts` — relay latch state and reset callbacks (mirrors
  `relay27Ref` pattern); exposes `relay59Tripped`, `resetRelay59`, `relay81ShedCount`
- `src/components/IndicatorLights.tsx` — ANSI-59 and ANSI-81 armed/tripped lights
- `src/App.tsx` — ANSI-59 reset dome (col 4, row 3), wiring for new relay state
- `src/components/StatusDisplay.tsx` — trip event annotation on the LCD
- No new dependencies
