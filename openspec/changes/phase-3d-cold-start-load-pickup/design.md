## Context

The simulation already has the full swing equation, governor, and damper windings (Stages 3a–3c). Load
is currently applied as a continuous Knob — `inputs.loadFraction` feeds directly into `computeLoad()`
every step, so there is no concept of "disconnected" load. The valve actuator lag `TAU_VALVE = 2.0 s`
was chosen for a steam plant; it gives unrealistically sluggish recovery on a diesel tug.

The UI currently mounts a `PositionIndicator` (twin-needle, valve setpoint vs actual) at row 1 / col 6.
At `TAU_VALVE ~0.3 s` the two needles are nearly always coincident and the instrument stops teaching
anything. The `StatusDisplay` LCD already shows several derived tiles (SAT, ΔP, etc.) and has capacity
for two more.

## Goals / Non-Goals

**Goals:**
- Add a load breaker that gates the active-load Knob as a single instantaneous step
- Revise `TAU_VALVE` to ~0.3 s (diesel throttle)
- Replace the `PositionIndicator` panel slot with a throttle-% LCD tile
- Expose `dampingTorque = D·(ω−ωref)` on `Outputs` and show it on the LCD

**Non-Goals:**
- Load ramp / soft-start — the whole point is the instantaneous step
- Modifying the swing equation, governor, or AVR physics
- Removing the `PositionIndicator` component from the codebase (keep it — steam/synchroscope reuse)
- Variable load block size — the breaker gates whatever the Knob is set to

## Decisions

### 1 — Breaker state lives in `Inputs`, not `SimState`

`loadBreaker: boolean` is added to `Inputs` alongside `avrOn` / `governorOn`. It is a user toggle, not
a physical dynamic state. The simulation step reads it each tick: when `false`, `Pe = 0` in the swing
equation (load sees no power), and `computeLoad()` is still called but its result is discarded for the
electrical solve. `SimState` requires no new fields.

**Alternative considered:** add `breakerClosed: boolean` to `SimState`. Rejected — there is no
hysteresis, integrator, or lag associated with the breaker; it is purely an input gate.

### 2 — Pe gating: zero load demand into solveMachine, not zeroing Pe post-solve

When the breaker is open, pass `{ p: 0, q: 0 }` into `solveMachine()` rather than overriding `Pe`
after the solve. This keeps the voltage chain honest: with no load, `Vt → Ea` (no-load terminal
voltage) and `Ia → 0`, which is the correct physical state. Zeroing Pe post-solve would leave a
spurious voltage drop in `Vt`.

**Alternative considered:** keep `computeLoad()` result but zero `Pe` only in the swing equation.
Rejected — `Vt` would be wrong (sag for a disconnected load).

### 3 — `TAU_VALVE` revised to 0.3 s

A diesel fuel rack moves in ~0.2–0.4 s; 0.3 s is the midpoint. The constant stays in `constants.ts`
as `TAU_VALVE`; only the value changes. Existing tests that reference a 2.0 s recovery must be updated.

### 4 — `dampingTorque` is a pure Outputs derived value, not a SimState field

`dampingTorque = DAMPING_D * (state.omega - OMEGA_REF)` is computed in `step()` and placed in
`Outputs`. It needs no history — it is `D·slip`, always derivable from current `omega`. It is zero at
synchronous speed and spikes transiently during load steps, which is exactly what the LCD tile shows.

### 5 — PositionIndicator unmounted via layout change, not conditional rendering

Remove the `PositionIndicator` cell from the row-1 grid in `App.tsx`. The component import stays;
no conditional logic is added. The col-6 slot in row 1 is freed — it becomes empty space or is absorbed
by the adjacent column depending on layout.

### 6 — Preset `loadBreaker` default: open (`false`) for all presets

All three presets (`cold-dark`, `spinning-dark`, `live-loaded`) ship with `loadBreaker: false`. The
`live-loaded` preset currently has load applied via the Knob; with the breaker defaulting open, the
preset starts with the load Knob pre-set but disconnected. This is intentional — the operator closes the
breaker to experience the load step, not to arrive in an already-loaded state.

## Risks / Trade-offs

- **`live-loaded` preset behaviour changes.** Previously the preset started with load fully connected.
  After this change, the Knob is pre-set but the breaker is open — operator must close to load. This is
  a teaching-moment improvement but is a visible behaviour change.
  → Document clearly in the preset description; no mitigation needed.

- **Twin needles coincident at `TAU_VALVE 0.3 s`.** Confirmed reason to remove `PositionIndicator` from
  the panel. The throttle-% LCD tile conveys the same information without the visual confusion of two
  needles that never separate.
  → No mitigation; removal is the correct response.

- **Tests with `TAU_VALVE = 2.0 s` hardcoded.** Any test asserting a recovery time or a specific
  `valveActual` after N steps will fail.
  → Audit all tests referencing `TAU_VALVE` or `valveActual` convergence; update expected values.
