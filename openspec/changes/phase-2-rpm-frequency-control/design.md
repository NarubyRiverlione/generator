## Context

Phase 1 has a fully working islanded generator simulator with fixed rotor speed (50 Hz). All physics run in `src/core/`; the React hook (`useGeneratorSimulation`) owns the animation loop; the UI renders inputs and gauges. Rotor speed is a constant in `constants.ts` and never flows into the solver.

Phase 2 adds a turbine governor control so users can observe that frequency and terminal voltage respond to *different* physical inputs — the turbine (speed) and the exciter (field). This separation is the conceptual prerequisite for synchronisation in Phase 3.

## Goals / Non-Goals

**Goals:**
- Expose rotor speed as a user-adjustable slider (47–53 Hz)
- Make internal EMF Eₐ proportional to speed so a speed drop sags voltage (and frequency), matching real machine physics
- Display output frequency as a live numeric readout
- Keep all new physics in `src/core/` with no physics in the hook or UI

**Non-Goals:**
- Governor droop curve or steady-state droop coefficient — the slider is direct speed command, not mechanical power
- P-frequency droop model (save for Phase 3 grid-connected)
- Inertia / swing equation — steady-state model only
- RPM display (Hz is sufficient for the educational goal)

## Decisions

### D1 — Speed scales Eₐ multiplicatively

**Decision:** `Ea_pu = field_pu × speed_pu` where `speed_pu = speedHz / 50`.

**Rationale:** In a synchronous machine the open-circuit EMF is proportional to both rotor flux (driven by field current) and angular velocity (ω). Multiplying field by speed_pu is the minimal, physically correct model. It means a 5 % speed drop at rated field produces the same Eₐ reduction as a 5 % field reduction — users directly observe that the turbine and the exciter move the *same* internal quantity through different channels.

**Alternative considered:** Speed only affects frequency output, voltage unaffected. Rejected — it would break the physics and hide the key teaching point.

### D2 — First-order speed lag, τ = 0.5 s

**Decision:** Apply a first-order lag to speed changes with time constant τ_speed = 0.5 s (separate from the field lag τ_field = 1.5 s).

**Rationale:** A raw step change in speed looks unnatural in the UI. A shorter τ than field represents that a governor / turbine responds faster than the exciter time constant, and gives users smooth visual feedback without the long tail they see on the field channel. τ = 0.5 s is fast enough to feel immediate but shows the settling animation.

**Alternative considered:** No lag (instant speed change). Rejected — the gauges jump discontinuously, losing the sense of physical inertia even in steady-state mode.

### D3 — Output frequency derived, not solved

**Decision:** `frequencyHz = 50 × speed_pu` added as a direct computed field in `SimulatorOutputs`. No separate solver step.

**Rationale:** In an islanded machine, output frequency equals rotor speed. There is no slip or load-dependent frequency offset in the steady-state model.

### D4 — Constant-power load model unchanged

**Decision:** Load demand (P, Q) continues to be set by the active-load and power-factor sliders, independent of speed. The quadratic solver is unchanged.

**Rationale:** The load model is constant-power by spec. Adding speed-dependent load would introduce governor droop physics that belong in Phase 3 (grid-connected), not Phase 2.

## Risks / Trade-offs

- **Risk:** Multiplying field × speed_pu could push Eₐ above the quadratic solver's PV-nose if both are at maximum (1.5 × 1.06 = 1.59 pu) → Mitigation: the existing voltage-collapse handler already freezes the last valid point; no new code needed, but test at the extremes.
- **Risk:** Adding a second lag state (speed) alongside the existing field lag state means the step function now carries two integrator states → Mitigation: keep both in the same `SimulatorState` struct; the structure is already designed for extension.
- **Trade-off:** Using direct speed command (not a governor droop curve) means the simulator does not model the real steady-state P vs. f droop. This is an intentional simplification; it can be addressed in Phase 3.

## Open Questions

- None — scope is tightly bounded by the PRD. Phase 3 (synchronisation) will need to revisit how speed_pu interacts with the grid reference frequency.

## UI Layout

### D5 — Expand to 6 columns; governor knob mirrors exciter field knob

**Decision:** Add a sixth column to the right of the existing 5-column switchboard grid. Column 6 holds the frequency gauge (row 1) and the turbine governor knob (row 2), mirroring the exciter field knob in column 1.

```
Col 1          Col 2–4 (LCD)   Col 5          Col 6 [NEW]
─────────────  ──────────────  ─────────────  ─────────────
Exciter AC     Rectified DC    Active Power   FREQUENCY
gauge          Main Field      gauge          gauge (47–53 Hz)
               Terminal Vt
─────────────  ──────────────  ─────────────  ─────────────
EXCITER        LCD             ACTIVE LOAD    TURBINE GOV
FIELD knob     (unchanged,     knob           knob [NEW]
               spans 2–4)
─────────────  ──────────────  ─────────────  ─────────────
Lights 1–4     Lights 5–8      POWER FACTOR   (empty)
               AVR controls    knob
```

The visual result: exciter field (left bookend) controls V/Q; turbine governor (right bookend) controls f/P. The physical separation of the two control channels becomes immediately legible from the panel layout.

**Rationale:** The 5-column grid currently sits at 798 px inside a 1080 px max-width panel — there is 282 px of slack. Adding a sixth column brings the panel to 950 px, leaving 130 px of headroom. No `max-width`, body padding, or panel padding changes are needed.

**The only CSS change required:**
```css
/* src/index.css — .switchboard-grid */
grid-template-columns: repeat(6, 138px);  /* was repeat(5, 138px) */
```

**Alternative considered:** Keep 5 columns and stack the governor knob below the exciter field knob in col 1, row 3 (displacing indicator lights). Rejected — it groups the two control channels together visually, which undermines the key teaching point that they are independent.

**Footer:** Update footer text from `PHASE 1 MVP` to `PHASE 2` once implemented.
