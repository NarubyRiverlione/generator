## Context

The turbine governor currently integrates the speed-changer switch command into `valvePct` — a single value that is simultaneously the governor demand and the valve position used to derive `rpmTarget`. The `speedLagged` state captures shaft inertia (τ_spinup = 2.5 s) but there is no separate mechanical lag for the valve actuator itself.

The `twin-needle-valve-dial` change introduces a `PositionIndicator` component with two needles — one for `setpoint` and one for `actual` — but wires both to placeholder values. This change provides the real physics behind those two values.

## Goals / Non-Goals

**Goals:**
- Introduce `valveActual` — a physical valve position state that lags `valvePct` through a first-order actuator lag (τ_valve = 2.0 s)
- Route `valveActual` (not `valvePct`) into `rpmTarget` so shaft dynamics respond to the physical valve, not the demand signal
- Expose both `valvePct` and `valveActual` in `Outputs` so the `PositionIndicator` has real values
- Wire `App.tsx` to pass `valvePct → setpoint` and `valveActual → actual` on `PositionIndicator`

**Non-Goals:**
- No change to jog rates, `VALVE_RPM_MAX`, `TAU_SPINUP`, or any machine equations
- No new UI components — `PositionIndicator` is provided by the `twin-needle-valve-dial` change
- No persistence or serialisation of the new state field

## Decisions

### D1 — `valveActual` drives `rpmTarget`, not `valvePct`

`valveActual` (physical position) drives `rpmTarget`; `valvePct` is the governor demand only.

**Rationale:** The physical valve opening controls the flow of working fluid into the turbine — the RPM target must follow the actual valve position, not the commanded setpoint. This is the physically correct model and makes the two-stage lag chain educational: operators can observe the setpoint needle move immediately when they hold the speed-changer, then watch `valveActual` and then RPM/Hz follow with compound lag.

**Alternative rejected:** Treating `valveActual` as cosmetic only and keeping `valvePct` driving `rpmTarget`. This would make the twin-needle display misleading — the "actual" needle would have no physical meaning.

### D2 — τ_valve = 2.0 s

**Rationale:** 2.0 s sits clearly between the field lag (1.5 s) and spin-up lag (2.5 s), is fast enough for the operator to maintain control authority, and is slow enough to produce a visible needle gap during fast jogging. At `JOG_FAST = 0.3125 %/s` the steady-state tracking error is ≈ 0.625 %; after releasing the switch, the actual needle takes ≈ 6 s (3τ) to close that gap — clearly visible and educational.

**Alternative rejected:** τ_valve = 1.0 s (gap too small to read on the dial at normal jog rates). τ_valve = 5.0 s (frustrating control response).

### D3 — No rename of `valvePct`

`valvePct` remains the setpoint; `valveActual` is the new field. This is backward compatible — existing references to `valvePct` in the hook, UI, and tests continue to work unchanged (they always referred to the governor demand, which is still `valvePct`).

### D4 — Initialise both to `VALVE_PCT_INIT`

Both `valvePct` and `valveActual` are initialised to ≈ 93.44 % in `initialState()` so the dial opens with needles aligned and no startup transient.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Adding a second lag lengthens total system response | τ_valve = 2.0 s is short; the compound system still settles comfortably within a few operator actions. TAU_SPINUP is unchanged. |
| `PositionIndicator` wiring task depends on twin-needle-valve-dial being merged | The physics tasks (constants, types, simulation) are independent. The App.tsx wiring task can be deferred if the companion change is not yet merged; placeholder props remain functional in the interim. |
| `lastValidOutputs` frozen on collapse must include `valveActual` | On a voltage collapse, the shaft readouts remain live. `valveActual` is a shaft-side quantity and SHALL remain live in both the collapsed and non-collapsed output paths, consistent with the existing treatment of `rpm`, `frequencyHz`, and `valvePct`. |

## Migration Plan

No data migration required — simulation state is ephemeral (in-memory only, reset on page load). The new `valveActual` field in `SimState` and `Outputs` is additive; no callers need updating beyond `App.tsx`.

**Merge order:** `twin-needle-valve-dial` should be merged before the `App.tsx` wiring task, but the physics tasks can land independently.
