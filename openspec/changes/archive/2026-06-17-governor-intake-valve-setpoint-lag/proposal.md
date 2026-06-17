## Why

The `twin-needle-valve-dial` change introduces a `PositionIndicator` component that requires two distinct values — `setpoint` (the commanded valve position) and `actual` (the physical valve position as it moves toward the setpoint). Currently `SimState.valvePct` is the integrated governor demand (the setpoint), but no separate valve-actuator lag exists; the `PositionIndicator` is wired to placeholder values until this companion change lands. Without a dedicated `valveActual` state, the twin-needle visual is meaningless.

## What Changes

- Add a `TAU_VALVE` constant — the valve actuator time constant (the mechanical lag of the motor-operated intake valve tracking its setpoint, independent of shaft inertia).
- Add `valveActual` to `SimState` — a new state variable tracking the physical valve position as it lags toward `valvePct` (the setpoint).
- Compute the valve-actuator lag in `simulation.ts` using the same exact-exponential form already used for `speedLagged` and field lag.
- Expose `valveActual` alongside `valvePct` in `Outputs`.
- Wire `App.tsx` to pass `valvePct` as `setpoint` and `valveActual` as `actual` to `PositionIndicator`, replacing the placeholders.

## Capabilities

### New Capabilities

_(none — no new capability spec files required)_

### Modified Capabilities

- `turbine-governor`: Add `valveActual` state with its own actuator lag (`TAU_VALVE`). The existing `valvePct` remains the setpoint. Both are exposed as outputs. Document the two-stage lag chain: governor command → setpoint (`valvePct`) → actuator lag → actual position (`valveActual`) → speed lag (`speedLagged`) → RPM/Hz.
- `simulation-core`: Add `valveActual` to the `Outputs` type and to the output mapping in `step()`.
- `simulator-ui`: `PositionIndicator` wired to real `setpoint` / `actual` values from simulation outputs instead of placeholders.

## Impact

- `src/core/constants.ts` — new `TAU_VALVE` constant
- `src/core/types.ts` — `valveActual` added to `SimState` and `Outputs`
- `src/core/simulation.ts` — valve-actuator lag step added to `step()`; `valveActual` included in returned `Outputs`
- `src/hooks/useGeneratorSimulation.ts` — `initialState()` call picks up new field automatically if `SimState` default is set in constants
- `src/App.tsx` — pass `valvePct` and `valveActual` to `PositionIndicator`
