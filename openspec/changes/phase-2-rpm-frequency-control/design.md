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
- **Coarse throttle valve and run-up from rest (0 → 1500 rpm)** — Phase 3. Phase 2 starts the machine
  already running and only trims the fine valve within the governable band.

## Decisions

### D1 — Speed scales Eₐ multiplicatively

**Decision:** `Eₐ_pu = field_pu × speed_pu`, where `speed_pu = speedHz / 50`.

**Rationale:** Open-circuit EMF is proportional to both rotor flux (field current) and angular velocity
(ω). Multiplying field by speed_pu is the minimal physically-correct model: a 5 % speed drop at rated
field gives the same Eₐ reduction as a 5 % field reduction — users see the turbine and the exciter move
the *same* internal quantity through different channels.

**Alternative considered:** Speed affects frequency only, voltage unaffected. Rejected — breaks the
physics and hides the key teaching point.

### D2 — Fine-valve kinematic speed: switch → fine-valve % → spin-up lag → speed

**Decision:** Real turbines have two intake valves — a **coarse** throttle (rollout / run-up from rest)
and a **fine** governor valve (frequency trim around the operating point). Phase 2 implements only the
**fine** valve; the coarse valve and run-up are deferred to Phase 3. The machine therefore starts
already running at 1500 rpm (coarse valve at run speed), and the fine valve only moves speed within the
narrow 47–53 Hz governable band.

The raise/lower switch commands the motor-operated **fine** valve. While the switch is held off
neutral, `valvePct` (fine-valve position) integrates at a jog rate; it holds when released. It maps
linearly to a target speed within the band, and actual speed follows through a first-order spin-up lag.

- Switch positions (spring-return to neutral): `⏪ ◀ ● ▶ ⏩`.
  - inner `◀ ▶`: slow jog ≈ 9 rpm/s (≈ 0.3 Hz/s, ≈ 5 %/s fine valve)
  - outer `⏪ ⏩`: fast jog ≈ 45 rpm/s (≈ 1.5 Hz/s, ≈ 25 %/s fine valve); full sweep ≈ 4 s
- Fine-valve→speed map (4-pole, RPM = 30 × Hz), linear over the band: 0 % → 1410 rpm (47 Hz),
  50 % → 1500 rpm (50 Hz), 100 % → 1590 rpm (53 Hz). 50 % is the nominal operating point.
  **0 % is the low end of the trim band, NOT a closed valve** — base speed is held by the coarse valve
  (assumed at run speed in Phase 2), so the machine never falls to 0 rpm here.
- Spin-up lag τ_spinup = 2.5 s (slower than the field lag at 1.5 s — the shaft is the slow element).

**Rationale:** This matches how an operator trims a running machine: nudge the fine valve, the shaft
eases to the new speed. The two timescales (jog rate, then spin-up lag) reproduce "the valve moves,
then the shaft takes even more time." It stays kinematic — no power balance — so the equilibrium is
always well-defined and stable, and it keeps startup physics (which only the coarse valve needs) out of
Phase 2. The coarse/fine split mirrors real two-valve turbine controls and hands run-up cleanly to
Phase 3.

**Alternative considered:** A single absolute 0–100 % intake valve where 0 % = closed = 0 rpm. Rejected
for Phase 2 — it drags run-up/startup physics in (what does 0 % mean if the machine must keep running?).
Splitting coarse (run-up) from fine (trim) defers that to Phase 3.

### D3 — RPM and frequency are derived readouts, not solved

**Decision:** `frequencyHz = 50 × speed_pu` and `rpm = 30 × frequencyHz` (4-pole) are computed each
step from the lagged speed and returned in `Outputs`; `valvePct` is also surfaced for display. No
separate solver step. RPM is the headline readout; Hz sits beside it.

**Rationale:** In an islanded machine, output frequency equals rotor speed; there is no slip or
load-dependent frequency offset in the steady-state model. Users anchor on RPM (1500 rpm) intuitively;
Hz carries the electrical/AVR meaning and the "f and V are independent" lesson.

### D4 — Constant-power load model unchanged

**Decision:** Load demand (P, Q) is still set by the active-load and power-factor controls, independent
of speed. The quadratic solver is unchanged.

**Rationale:** The load model is constant-power by spec. Speed-dependent load would introduce droop
physics that belong in Phase 3.

### D5 — UI: governor speed-changer switch + RPM/Hz/valve readouts in the switchboard grid

**Decision:** Reuse the AVR selector-switch styling for the governor speed-changer (a spring-return
raise/lower switch with a neutral centre and two-stage throw). Place it on the right-hand side of the
existing switchboard grid as the speed/frequency bookend, mirroring the exciter-field control on the
left — making the two independent channels legible from the panel itself. Add RPM (headline), Hz, and
valve-position (%) readouts to the generator-output area.

This supersedes the earlier 6-column / frequency-gauge sketch: the current panel is knob- and
selector-based (not the old slider layout), the frequency is shown as a **numeric readout** (not a
gauge), so no `grid-template-columns` change to a 6th column is required — the switch and readouts fit
the existing grid. Exact cell placement to be settled during implementation against `App.tsx`.

**Footer:** Update footer text from `PHASE 1 MVP` to `PHASE 2` once implemented.

## Risks / Trade-offs

- **Risk:** `Eₐ = field × speed_pu` could push Eₐ above the solver's PV-nose at the extremes
  (field 1.5 × speed 1.06 = 1.59 pu). Mitigation: the existing voltage-collapse handler freezes the
  last valid point; test at the extremes.
- **Risk (new — interaction with protection):** lowering the valve sags speed → `Eₐ = field × speed_pu`
  drops → terminal voltage sags → if Vₜ crosses 0.85 pu the **ANSI-27 under-voltage relay trips and
  sheds the load** (per the `2026-06-15-protection-and-stability` work). At 47 Hz (speed_pu ≈ 0.94)
  with already-modest field this is reachable. This is a legitimate teaching moment (underspeed →
  undervoltage trip), but Phase 2's "speed reduction sags Vₜ" scenarios MUST set field high enough that
  Vₜ stays above 0.85, or they will trip the relay and shed the load mid-test. Decide per scenario
  whether the trip is the point or an artefact.
- **Trade-off:** the kinematic spin-up lag is inertia-flavoured but is not a true swing equation, so
  the simulator does not yet show emergent frequency from power balance. Intentional; deferred to
  Phase 3.

## Open Questions

- None blocking. Phase 3 (startup + synchronisation) introduces the coarse throttle valve and shaft
  run-up from rest, the true swing equation, and how speed_pu interacts with the grid reference
  frequency. (Note: this change's coarse/fine split and band-only scope diverge from the PRD's original
  single "47–53 Hz governor slider" wording — the PRD/README/concept docs need a matching update,
  tracked separately.)
