## Context

Phase 1 has a working islanded generator simulator with fixed rotor speed (50 Hz). All physics run in
`src/core/`; the React hook (`useGeneratorSimulation`) owns the animation loop; the UI renders inputs
and gauges as a switchboard grid. Rotor speed is a constant and never flows into the solver.

Phase 2 adds a turbine governor so users observe that frequency and terminal voltage respond to
*different* physical inputs — the turbine (speed) and the exciter (field). The control mirrors a real
switchboard: a spring-return **raise/lower speed-changer switch** drives a motor-operated intake valve;
**RPM** and **Hz** are readouts of the resulting shaft speed, not inputs.

## Goals / Non-Goals

**Goals:**
- Command rotor speed indirectly, through a turbine intake valve driven by a raise/lower switch.
- Make internal EMF Eₐ proportional to speed so a speed change moves both voltage and frequency.
- Display RPM (headline), Hz, and valve position as live readouts.
- Keep all new physics in `src/core/`; no physics in the hook or UI.

**Non-Goals:**
- True rotor inertia / swing equation (`J·dω/dt`). Speed follows the valve through a *kinematic*
  first-order spin-up lag, not a power-balance integration. Frequency is not emergent from Pm − Pe.
  (Reversal of the Phase-1 "no inertia" stance is intentional but limited to this kinematic lag; the
  full swing model is deferred to Phase 3, which needs it for grid sync.)
- Governor droop curve / steady-state droop coefficient — the valve maps directly to a target speed.
- P–frequency droop model (Phase 3, grid-connected).
- Load that depends on speed/frequency — the constant-power load model is unchanged.
- **Shaft run-up from rest (0 → operating RPM)** — Phase 3. Phase 2 starts with the valve pre-set at
  the operating position; the operator trims from there.

## Decisions

### D1 — Speed scales Eₐ multiplicatively

**Decision:** `Eₐ_pu = field_pu × speed_pu`, where `speed_pu = rpm / 1500`.

**Rationale:** Open-circuit EMF is proportional to both rotor flux (field current) and angular velocity
(ω). Multiplying field by speed_pu is the minimal physically-correct model: a 5 % speed drop at rated
field gives the same Eₐ reduction as a 5 % field reduction — users see the turbine and the exciter move
the *same* internal quantity through different channels.

**Alternative considered:** Speed affects frequency only, voltage unaffected. Rejected — breaks the
physics and hides the key teaching point.

### D2 — Single intake valve: valve % → RPM → Hz

**Decision:** A single intake valve spanning 0–100 %, where 0 % = fully closed = 0 rpm and 100 % =
1600 rpm (the overspeed trip point, ~107 % of rated). The map is linear:

```
rpmTarget   = (valvePct / 100) × 1600
speed_pu    = rpmTarget / 1500
frequencyHz = rpm / 30         ← derived last; the shaft knows only RPM
```

Rated speed (1500 rpm / 50 Hz) corresponds to ~93.75 % valve. In a real plant at full load the intake
valve is ~90–95 % open; the last few percent are reserved for governor response headroom — this model
reflects that honestly. The simulation starts with the valve pre-set at ~93.1 % (giving 1495 rpm,
slightly sub-synchronous). The operator trims from there using the speed-changer switch.

The raise/lower switch commands the valve position. While held off neutral, `valvePct` integrates at
a jog rate and holds when released (spring-return to neutral). Two throw stages:
- inner (▼ ▲): slow jog — fine trim near the operating point
- outer (▼▼ ▲▲): fast jog — larger movement

**Direction of causality is shaft-first:** the shaft produces RPM, which implies Hz. Hz is never used
as an intermediate variable in the calculation chain — only as a final display readout.

**Why not a fine-trim band (47–53 Hz floor/ceiling)?** A band requires an artificial floor on valve
position, making 0 % physically meaningless (a "low end of the band" rather than a closed valve). It
also puts Hz in the driver's seat, which inverts the physics. The single-valve model is honest: 0 % =
closed = 0 rpm. Phase 2 starts with the valve already at the operating point (machine delivered to the
operator already running); Phase 3 models the startup sequence from 0 rpm, where the swing equation
is needed to simulate run-up dynamics.

**Spin-up lag τ_spinup = 2.5 s** (slower than the field lag at 1.5 s — the shaft is the slow element).

**Rationale:** Starting at ~1495 rpm (slightly sub-synchronous) mirrors real operation: the turbine
hasn't yet been trimmed to exact synchronous speed. The operator uses the speed-changer to reach
1500 rpm before synchronising to the grid (Phase 3). The visual implication — the dial near its upper
quarter at startup — is correct and teaches an important lesson: the valve is almost fully open at rated
speed; there is little room above, and plenty of room below.

### D3 — RPM and frequency are derived readouts, not solved

**Decision:** `rpm = (valvePct / 100) × 1600` and `frequencyHz = rpm / 30` (4-pole) are computed each
step from the lagged speed and returned in `Outputs`; `valvePct` is also surfaced for display. No
separate solver step. RPM is the headline readout; Hz sits beside it as the electrical/grid-relevant
unit.

**Rationale:** In an islanded machine, output frequency equals rotor speed; there is no slip or
load-dependent frequency offset in the steady-state model. Users anchor on RPM (1500 rpm) intuitively;
Hz carries the electrical/AVR meaning and the "f and V are independent" lesson.

### D4 — Constant-power load model unchanged

**Decision:** Load demand (P, Q) is still set by the active-load and power-factor controls, independent
of speed. The quadratic solver is unchanged.

**Rationale:** The load model is constant-power by spec. Speed-dependent load would introduce droop
physics that belong in Phase 3.

### D5 — UI: governor speed-changer switch + RPM/Hz/valve readouts in the switchboard grid

**Decision:** Reuse the existing rotary-dial styling for the governor speed-changer (a spring-return
raise/lower switch with a neutral centre and two-stage throw). Place it on the right-hand side of the
existing switchboard grid as the speed/frequency bookend, mirroring the exciter-field control on the
left — making the two independent channels legible from the panel itself. Add RPM (headline), Hz, and
valve-position (%) readouts to the generator-output area.

**Footer:** Update footer text from `PHASE 1 MVP` to `PHASE 2` once implemented.

## Risks / Trade-offs

- **Risk:** `Eₐ = field × speed_pu` could push Eₐ above the solver's PV-nose at the extremes
  (field 1.5 × speed_pu 1.067 at 100 % valve ≈ 1.6 pu). Mitigation: the existing voltage-collapse
  handler freezes the last valid point; test at the extremes.
- **Risk (interaction with protection):** lowering the valve sags speed → `Eₐ = field × speed_pu`
  drops → terminal voltage sags → if Vₜ crosses 0.85 pu the **ANSI-27 under-voltage relay trips and
  sheds the load**. This is a legitimate teaching moment (underspeed → undervoltage trip), but test
  scenarios that intend to demonstrate speed reduction WITHOUT tripping MUST set field high enough that
  Vₜ stays above 0.85.
- **Trade-off:** the kinematic spin-up lag is inertia-flavoured but is not a true swing equation, so
  the simulator does not yet show emergent frequency from power balance. Intentional; deferred to
  Phase 3.

## Open Questions

- None blocking. Phase 3 (startup + synchronisation) introduces shaft run-up from rest, the true swing
  equation, and how speed_pu interacts with the grid reference frequency.
