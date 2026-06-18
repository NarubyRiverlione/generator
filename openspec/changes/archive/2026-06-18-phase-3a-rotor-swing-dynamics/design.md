## Context

Phase 2 models rotor speed **kinematically** (`src/core/simulation.ts`, lines 127–139): the physical
valve position is converted to a speed *target*, a load-proportional droop offset (`Pe_prev · govDroop`)
is subtracted, and a first-order lag (`TAU_SPINUP = 2.5 s`) glides `speedLagged` toward that target.
Speed is therefore *commanded* — there is no force or energy balance, the shaft cannot be run up from
rest with real inertia, and a fixed valve always lands on a clean steady frequency (the droop offset).

This stage replaces that kinematic model with the **swing equation**, the textbook rotor-dynamics
relation. Speed becomes the integral of power imbalance over inertia — a *result*, not an input. This
is the physics foundation every later Phase 3 stage builds on:

- **3b (governor)** adds an isochronous PI controller that commands `Pm` to hold rated frequency — the
  manual valve→Pm control this stage introduces is what the governor automates.
- **3c (grid sync)** adds the power angle `δ = ∫(ω − ω_grid)dt` and a synchronising-power term
  `Pmax·sin(δ)` that enters the swing equation as part of `Pe`. The equation written here must be
  shaped so additional `Pe` terms drop in cleanly.

The output surface (RPM, Hz, valve readouts) stays stable; only what *produces* `ω` changes.

## Goals / Non-Goals

**Goals:**

- Replace the kinematic speed lag with the undamped swing equation `2H · dω/dt = Pm − Pe`, with `ω`
  a genuinely integrated state.
- Re-aim the speed-changer: the physical valve position commands **mechanical power in (`Pm`)**, not a
  speed target.
- Add the inertia constant `H` as a machine parameter (no damping term — see D2).
- Support shaft run-up from rest (ω = 0 → rated) under surplus `Pm` with the load disconnected.
- Make the intended behaviour shift real: after a load step a **fixed valve has no reachable stable
  frequency** — frequency drifts and the operator must raise the valve to rebalance `Pm = Pe`.

**Non-Goals:**

- No automatic governor (3b), no grid / breaker / synchronisation (3c), no loss-of-step / pole-slip (3d).
- No oscillatory "swing-and-settle" frequency behaviour — there is no restoring force in the islanded
  machine, so frequency *drifts linearly*, it does not ring. (The oscillation the proposal's prose
  hints at belongs to 3c, once `Pmax·sin δ` provides a restoring force.)
- No change to the voltage/Q channel, the AVR, or saturation.
- **No damping term `D` in this stage.** A `D·(ω−1)` term is a restoring force toward rated speed — it
  makes the machine self-correct and settle on its own, which is the governor's job (3b) and the grid's
  job (3c), not 3a's. Including it here would contradict the "no self-regulation, operator must act"
  lesson. The islanded swing equation is the bare `(Pm − Pe)/2H` integrator (see Decisions).

## Decisions

### D1 — Swing equation form

Adopt the per-unit swing equation in its bare, undamped form, integrated each step:

```
dω/dt = (Pm − Pe) / (2H)
ω ← ω + dω/dt · dt        (explicit/forward Euler)
```

- `H` — inertia constant (seconds of rated kinetic energy). New constant in `constants.ts`.
- `ω` — rotor speed in pu (1.0 = 1500 rpm). Replaces the integrated state currently called
  `speedLagged`.

No damping term `D` (see D2). For a constant-power islanded load `Pe` is independent of `ω`, so this is
a **pure integrator**: forward Euler is effectively exact, and there is genuinely no equilibrium the
rotor can find on its own.

**Pe is taken from the previous step** (`state.lastValidOutputs.p`), exactly as Phase 2 already uses
`Pe_prev`. This avoids a circular dependency (solve needs `ω`, `ω` needs `Pe`); the one-step lag (~33 ms)
is negligible at simulator cadence, and it keeps the 3c synchronising-power term easy to add to the same
`Pe` expression. *Alternative considered:* solve-then-integrate within the step (implicit-ish). Rejected
— more code churn, no perceptible benefit, breaks the established `Pe_prev` pattern.

### D2 — No damping term `D` in this stage (the load-bearing decision)

3a teaches that an islanded machine **does not self-regulate**: a load step makes frequency drift, and it
keeps drifting until the *operator* opens the valve. A damping term `D·(ω−1)` would break that lesson,
because it is a restoring force toward rated speed. With constant `Pm`, `Pe` it gives the ODE a stable
equilibrium `ω* = 1 + (Pm − Pe)/D` that the rotor settles toward exponentially (time constant `2H/D`) —
i.e. the machine self-corrects to a steady off-nominal frequency **with no operator action**. That is
exactly the droop / self-regulation this stage is meant to *not* have yet.

So `D` is **dropped entirely** from 3a. Two supporting points:

1. **`D` is not needed for numerical stability.** With constant-power load `Pe` is independent of `ω`, so
   the equation is a pure integrator — there is no ω-feedback to oscillate, and forward Euler is
   effectively exact.
2. **Self-regulation is deferred by design.** The restoring force toward rated frequency is the
   *governor's* job (3b), and physical damping has its genuine home in 3c, where `Pmax·sin δ` is a real
   restoring force that needs it. Introducing `D` in 3a would pre-empt both and muddy the teaching point.

*Alternative considered:* keep a small/vestigial `D` tuned so its equilibrium sits outside the operating
band. Rejected — even a tiny `D` contradicts the "no restoring force / monotonic drift" model in prose,
buys nothing pedagogically, and re-introduces droop-shaped behaviour the stage exists to remove.

### D3 — Valve → mechanical power (`Pm`) mapping

The physical valve position (`valveActual`, still produced by the existing actuator lag `TAU_VALVE`)
maps **linearly** to mechanical power:

```
Pm = (valveActual / 100) · PM_MAX
```

`PM_MAX` is anchored so that the familiar rated valve position (~93.4 %) yields `Pm ≈ 1.0` pu, giving
`PM_MAX ≈ 1.07` (i.e. 100 % valve = ~107 % power — a small headroom that mirrors the existing overspeed
margin, `VALVE_RPM_MAX = 1600` ≈ 107 % rated). `Pm` is treated as power directly, independent of `ω`
(a turbine's mild torque×speed dependence is not modelled — a deliberate simplification).

### D4 — `Pe` on collapse is zero (load rejection)

When the machine solve collapses (load beyond loadability, `Vt → 0`), no power can transfer, so **`Pe`
fed to the swing equation is 0**, not the frozen last-valid (nonzero) value. Freezing a phantom load
would make the rotor integrate against power that isn't being delivered and spiral. `Pe = 0` on collapse
models load rejection: the rotor accelerates, which is physically correct and keeps the integrator sane.

### D5 — `ω` bounds tie into the existing overspeed concept

A pure integrator runs unbounded. During no-load run-up with surplus `Pm` (and `Pe = 0`), `ω` rises at a
constant rate and never stops climbing on its own, so the operator **must trim the valve** to `Pm ≈ 0`
as it approaches 50 Hz — exactly the intended manual skill. To prevent silent runaway, wire `ω` to the
existing overspeed concept (`VALVE_RPM_MAX` / ~107 %): clamp and/or surface an overspeed state at that
ceiling rather than letting RPM grow without limit. (A symmetric floor at `ω = 0` is already natural —
the rotor cannot spin backwards.)

### D6 — Run-up / operating sequence

The constant-power load cannot be served at low speed (the solve collapses with `Vt ≈ 0`). The supported
sequence — which matches the existing **cold-dark** start preset — is:

1. Spin up **dark and unloaded** (field off or low, `loadFraction = 0`, `Pe = 0`): surplus `Pm`
   accelerates the rotor from `ω = 0`.
2. **Excite** to establish terminal voltage near rated.
3. **Apply load**; frequency then sags and the operator chases it with the valve.

This ordering is documented behaviour, not an enforced state machine. The pre-spun **spinning-dark** and
**live-loaded** presets start later in this sequence.

### D7 — Rename `speedLagged` → `omega`; remove `TAU_SPINUP`

The state field `speedLagged` is no longer a lag — it is an integrated rotor speed. Rename it to `omega`
(`SimState.omega`) for semantic honesty; the codebase prefers names that read true. `TAU_SPINUP` is
deleted (the `2H` integration sets the run-up timescale). The `Outputs` surface (`rpm`, `frequencyHz`,
`valvePct`, `valveActual`) is unchanged — `rpm = omega · RPM_RATED`, `frequencyHz = rpm / 30` as before.
*Alternative:* keep the `speedLagged` name to minimise churn. Rejected — it would actively mislead every
future reader of the swing-equation code.

### D8 — Deprecate `govDroop` and `droopRpm`

The droop-correction term (`effectiveTarget = speedTarget − Pe_prev · govDroop`) is **removed**: speed
now emerges from the swing equation, not a droop offset. `govDroop` and the derived `droopRpm` output
become dead weight — 3b is explicitly **isochronous** (no droop) and droop/load-sharing returns only in
Phase 4. Therefore:

- Remove the droop-correction from the speed model.
- Remove `droopRpm` from `Outputs` and the `govDroop` param (or, if a UI readout still references
  `droopRpm`, replace that readout with a swing-relevant signal such as the power imbalance `Pm − Pe`).
- The specs artifact marks the **"Governor droop parameter"** requirement and the `droopRpm` half of the
  **"Saturation-derate and load-droop signals"** requirement as REMOVED/MODIFIED, and flags the
  `simulator-ui` readout copy.

*Alternative:* keep `govDroop` as a silently-unused param. Rejected — silent dead state is exactly what
the codebase's "names read true" preference rejects, and it would confuse the 3b governor work.

## Risks / Trade-offs

- **Risk: a damping term `D` creeps back in and silently re-introduces self-regulation.** → No `D` in
  3a (D2); the swing equation is the bare `(Pm − Pe)/2H` integrator. A restoring force toward rated
  speed is deferred to the 3b governor and the 3c grid.
- **Risk: proposal prose ("dip, swing, and recover") leaks into specs as an oscillation requirement the
  islanded model cannot produce.** → Specs/scenarios describe **linear frequency drift** under fixed
  valve, not damped ringing; "recover" is the operator action, not physics. Oscillation is deferred to 3c.
- **Risk: rotor integrates against a phantom load on collapse and spirals.** → `Pe = 0` on collapse (D4).
- **Risk: unbounded `ω` runaway during run-up / under-fuelled drift.** → Clamp/trip at the existing
  overspeed ceiling; floor at 0 (D5).
- **Trade-off: `Pe_prev` one-step lag** introduces a ~33 ms delay between solve and integration. →
  Negligible at simulator cadence; preserves the existing pattern and the clean 3c extension point.
- **Trade-off: renaming `speedLagged` and removing `govDroop`/`droopRpm`** touches `types.ts`,
  `constants.ts`, `initialState`, the start-point presets, the UI readout, and tests. → Accepted for
  clarity; the churn is mechanical and caught by the type checker and tests.

## Open Questions

- **`H` (inertia constant) value.** Sets the run-up time and how fast frequency drifts on a load step.
  Proposed starting point ~3–5 s; final value is a feel call to confirm during implementation. (This is
  now the only physics tuning knob in the stage — `D` is gone, see D2.)
- **`droopRpm` readout replacement.** If the LCD currently shows `droopRpm`, confirm whether to drop the
  readout entirely or replace it with the power imbalance `Pm − Pe` (D8).
