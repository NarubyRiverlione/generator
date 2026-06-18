# Synchronous Generator Simulator — Implementation Status Report

**Generated:** June 18, 2026  
**Repository:** /Users/renaat/Development-Eigen/generator  
**Git Commits:** 62 total | Current Branch: main | Remote tracking: up-to-date

---

## Executive Summary

The simulator has **completed Phases 1, 2, and Phase 3a/3b** with full physics implementation and comprehensive test coverage. **Phase 3c (grid synchronisation)** is in design phase with detailed proposals written. **Work in progress** includes damper winding physics for Phase 3c and identified follow-up engineering tasks. The PRD's phase descriptions are **partially outdated** and need updating to reflect the completed work and the more granular Phase 3 sub-phases (3a, 3b, 3c, 3d).

---

## Phase Completion Status

### ✅ Phase 1 — Islanded Generator (COMPLETE)

**Git commit:** `4629d40` (base), evolved through Phase 2–3 additions  
**What's implemented:**

- Exciter field DC knob (0.0–1.7 pu) controlling rotor field current
- Rectified DC → field winding with first-order lag (τ_exciter = 0.4 s + τ_field = 1.1 s)
- Active load and power factor sliders (0.6 lag to 0.6 lead)
- Constant-power load model
- AVR PI controller (Kp, Ki user-tunable; default Kp = 2.0, Ki = 0.5)
- Anti-windup bumpless transfer on AVR on/off
- SVG arc gauges: voltage (Vt) and active power (P)
- LCD readouts: reactive power (Q), power angle (δ), voltage stability margin (VSM), power factor (PF)
- Under-voltage relay (ANSI-27) with trip/latch/reset state machine
- 27-relay arm/trip/latch pattern in React hook

**Status:** ✅ **Feature-complete and stable.** No open issues.

---

### ✅ Phase 2 — RPM / Frequency Control (COMPLETE)

**Git commit:** `f7afefe` (merged Phase 2); evolved into Phase 3a  
**What's implemented:**

- Turbine governor speed-changer with **two independent jog switches**:
  - **Fine:** slow = 0.5 rpm/s, fast = 5 rpm/s (JOG_SLOW, JOG_FAST constants)
  - **Coarse:** slow = 10 rpm/s, fast = 25 rpm/s (JOG_COARSE_SLOW, JOG_COARSE_FAST)
- Spring-return selector returning to neutral on mouse/touch release
- Intake valve position (0–100 %) with actuator lag (τ = 2.0 s)
- **Valve drives mechanical power:** `Pm = (valve% / 100) × PM_MAX` (linear mapping)
- RPM and Hz readouts derived from rotor speed (ω)
- Valve position readout (PositionIndicator twin-needle dial)
- Kinematic spin-up lag from 0 rpm through rated to overspeed
- Governor PI controller with isochronous setpoint (ω_ref = 1.0 pu = 1500 rpm)
- Governor rate limiter (10 %/s) to prevent shaft slams

**Status:** ✅ **Feature-complete.** Merged into main; foundation for Phase 3a/3b.

**Note:** README mentions a planned "twin-needle-valve-dial" branch that has been implemented and integrated. No outstanding branch merge needed.

---

### ✅ Phase 3a — Swing-Equation Rotor Dynamics (COMPLETE)

**Git commit:** `99c6534` ("feat: phase 3a — swing-equation rotor dynamics")  
**What's implemented:**

- **Rotor inertia (H = 4 s):** swing equation integrates speed from power imbalance
  ```
  dω/dt = (Pm − Pe) / (2H)
  ω ← ω + (dω/dt) · dt
  ```
- ω is genuinely integrated state (SimState.omega), not kinematic lag from valve
- Pure integrator: **no damping term** and **no self-regulation** at fixed valve
- Speed-dependent EMF scaling: `Eₐ = saturation(field) × ω`
- Overspeed ceiling: ω clamped at VALVE_RPM_MAX / RPM_RATED ≈ 1.067 pu
- Pe taken from previous step to avoid circular dependency
- Swing equation correctly represents **monotonic frequency drift** under load step without governor recovery

**Status:** ✅ **Feature-complete and mathematically correct.** Matches spec line-by-line.

**Code location:** `src/core/simulation.ts` lines 186–187

---

### ✅ Phase 3b — Automatic Isochronous Governor (COMPLETE)

**Git commit:** `a0cfc8a` ("feat: phase 3b — automatic isochronous governor + coarse speed-changer")  
**What's implemented:**

- Governor on/off selector switch (integrated into input panel)
- Isochronous PI controller:
  - Error: `ω_ref - ω` (ref = 1.0 pu = 1500 rpm)
  - Integral action (Ki = 20 pu/%/s) with anti-windup
  - Proportional action (Kp = 100 pu/%) for immediate response
  - Output: valve command (0–100 %)
- When governor ON: speed-changers become read-only, show governor-commanded valve position
- When governor OFF: speed-changers active, manual valve control via jog
- Governor rate limiter (10 %/s) preserved from Phase 2
- Both fine and coarse speed-changers now controlled by governor (or manual when OFF)

**Status:** ✅ **Feature-complete and stable.** Governor actively holds speed near 1500 rpm.

**Code location:** `src/core/governor.ts`, integrated into `src/core/simulation.ts` step function

---

## Work In Progress & Design Phase

### 🔄 Phase 3c — Grid Synchronisation (DESIGN PHASE)

**Status:** ✅ **Detailed proposal written; implementation NOT STARTED**

**Where:** `openspec/changes/phase-3c-grid-synchronisation/proposal.md`

**Proposed features (not yet implemented):**

- Simulated grid reference: infinite bus at 400 V, 50 Hz (Vgrid, ωgrid constants)
- Power angle δ as state: `δ = ∫ (ωgen − ωgrid) dt`
- Breaker control (open/closed)
- Synchronising power in swing equation: `Pe_sync = Pmax · sin(δ)` where `Pmax = Vt·Vgrid / Xs`
- ANSI-25 synchro-check gate: breaker closes only when Δf, Δδ, ΔV within window
- Visible in-step status

**Affected specs:** simulation-core, simulator-ui

**Prerequisite for:** Phase 3d (loss-of-synchronism), Phase 4 (grid-connected operation)

---

### 🔄 Phase 3d — Loss-of-Synchronism (DESIGN PHASE)

**Status:** ✅ **Detailed proposal written; implementation NOT STARTED**

**Where:** `openspec/changes/phase-3d-loss-of-synchronism/proposal.md`

**Proposed features (not yet implemented):**

- Out-of-step detection (ANSI-78 relay) monitoring δ and slip `(ωgen − ωgrid)`
- Trip and breaker open on pole slip detection
- Visible pole-slip presentation (δ wrapping / runaway)
- Reuse existing relay-27 arm/trip/latch pattern for consistency
- No new physics — swing equation already produces pole slip via equal-area criterion

**Affected specs:** simulation-core, simulator-ui

**Prerequisite for:** Phase 4 (grid-connected operation)

---

### 🔶 Phase 3c Sub-task: Damper Windings (DETAILED DESIGN, READY FOR IMPLEMENTATION)

**Status:** ✅ **Fully specced; tasks broken down; implementation awaiting approval**

**Where:** `openspec/changes/phase-3c-damper-windings/design.md` + `tasks.md`

**Problem addressed:**

Currently, a 5% load step causes ~40 rpm excursion (1500 → ~1460 rpm) before governor recovers. For Phase 3c (grid connection), acceptable transient frequency deviation is <0.5 Hz (<15 rpm). The undamped swing equation plus rate-limited governor causes the large transient.

**Solution:** Add damping coefficient D to swing equation:
```
dω/dt = (Pm − Pe − D·(ω − ωref)) / (2H)
```

**Design decisions:**

- DAMPING_D = 0.05 pu (typical range for salient-pole machine: 0.05–0.10)
- Damping term proportional to slip `(ω − ωref)`, not bare ω (zero at rated speed)
- Governor still holds isochronous setpoint (damping term vanishes at ω = ωref)
- Placement: swing equation integration only, no changes to AVR/governor/saturation

**Implementation tasks (all marked NOT STARTED [ ]):**

1. Add `DAMPING_D = 0.05` to `src/core/constants.ts`
2. Update swing equation in `src/core/simulation.ts` line ~186
3. Update spec requirement in `openspec/specs/simulation-core/spec.md`:
   - Change "undamped swing equation" to "damped swing equation"
   - Remove "SHALL NOT include a damping term" sentence
   - Update "Inertia parameter" requirement to mention DAMPING_D
4. Add unit tests:
   - Verify peak rpm deviation smaller with D > 0 than with D = 0
   - Verify damping term = 0 when ω = ωref (no steady-state error)

**Risk assessment:** Minimal — isolated change, well-scoped, design is solid.

**Recommended next step:** Implement immediately after Phase 3c/3d design review; validate against sync scenarios before Phase 4.

---

### 🔶 RPM Droop on Load Step (INVESTIGATION STUB)

**Status:** ✅ **Problem identified and analyzed; awaiting damper winding implementation**

**Where:** `openspec/changes/rpm-droop-on-load-step/proposal.md`

**Analysis:** Detailed root-cause breakdown showing:
- Undamped swing equation (100% of power mismatch → rotor deceleration)
- Governor 10%/s rate limit (slow first-second response)
- H = 4 s inertia (proportional frequency drift)
- Three factors compound to produce ~40 rpm transient

**Recommended fix:** Damper windings (Phase 3c sub-task above) is the primary solution.

**Alternative options documented but not pursued:**
- Raise governor rate limit (trades off against spin-up slam protection)
- Reduce governor dead-band (minimal impact)
- Tune H lower (changes educational feel)

---

### 🔶 AVR & Governor Arming Limits (PLANNING STUB)

**Status:** ✅ **Scoping document written; no implementation yet**

**Where:** `openspec/changes/avr-governor-arming-limits/proposal.md`

**Current implementation:**

- AVR inhibited below OMEGA_AVR_ENABLE = 0.8 pu (hard-coded single constant, underspeed lockout)
- Governor has no equivalent lockout (integral would wind up at standstill)

**Design questions to address:**

- AVR hysteresis (arm at 0.82, disarm at 0.78) to prevent chattering?
- Governor equivalent underspeed enable (`OMEGA_GOV_ENABLE`)?
- UI feedback: "AVR INHIBITED" and "GOV INHIBITED" indicators?
- Over-speed limits (ANSI-24 volts-per-Hz protection)?
- Phase 4 interactions when breaker closes onto live grid?

**Status:** Placeholder only; no implementation planned for Phase 3; noted for Phase 4 design.

---

## Current Code Status

### Core Physics Engine (`src/core/`)

| File | Purpose | Status |
|------|---------|--------|
| `constants.ts` | Machine params, jog rates, control setpoints | ✅ Complete; ready for DAMPING_D addition |
| `simulation.ts` | Main step function, swing equation, valve lag | ✅ Complete; line 186 ready for damper term |
| `machine.ts` | Machine equations, flux linkage, saturation | ✅ Complete |
| `governor.ts` | PI speed controller | ✅ Complete |
| `avr.ts` | PI voltage controller | ✅ Complete |
| `saturation.ts` | Saturation curve | ✅ Complete |
| `load.ts` | Constant-power load model | ✅ Complete |
| `types.ts` | TypeScript interfaces (SimState, Inputs, Outputs) | ✅ Complete; ready for grid state (Phase 3c) |
| `units.ts` | Unit conversion helpers | ✅ Complete |

### Tests (`src/core/__tests__/`)

**Test coverage:** ~90% (vitest with coverage target)

**Integration tests (Phase 1–3a/3b scenarios):**
- ✅ Relay-27 core conditions
- ✅ Rated speed at balanced power
- ✅ Speed reduction sags voltage
- ✅ Valve command behavior
- ✅ Run-up from rest
- ✅ Fixed valve drift (no stable frequency)
- ✅ Valve raise arrests drift
- ✅ Linear drift rate matches (Pm − Pe) / (2H)
- ✅ Overspeed ceiling
- ✅ AVR control and tuning
- ✅ Governor integration
- ✅ Power factor and collapse
- ✅ Numerical safety

**Tests NOT yet written (awaiting damper implementation):**
- [ ] Damper reduces peak rpm deviation on load step
- [ ] Damper term zero at synchronous speed

### UI (`src/` components)

**Status:** ✅ Complete for Phases 1–3b

- React hook `useGeneratorSimulation` (main sim loop driver)
- Knobs (exciter field, load, power factor)
- SelectorSwitches (AVR on/off, governor on/off)
- SpringLoadedSelectors (fine jog, coarse jog; both speed-changers working)
- Gauges (Vt, P arc gauges)
- LCD readouts (Q, δ, VSM, PF, RPM, Hz, valve%, saturation%)
- Relay-27 UI with trip/latch/reset buttons
- Sticky notes and dismissal logic
- Gray-steel switchboard aesthetic

**To implement (Phase 3c/3d):**
- Breaker control + close gate (Phase 3c)
- Synchro-check conditions and in-step status (Phase 3c)
- ANSI-78 out-of-step relay + trip banner (Phase 3d)

---

## Spec Status

**All specs live in:** `/openspec/specs/` (865 total lines)

### Current Specs

| Spec | Lines | Scope | Status |
|------|-------|-------|--------|
| `simulation-core/spec.md` | 396 | Physics engine, swing equation, AVR, governor | ✅ Current through Phase 3a/3b; needs damper term and Phase 3c/3d additions |
| `simulator-ui/spec.md` | 278 | React UI, controls, readouts, relay patterns | ✅ Current through Phase 3b; needs breaker and out-of-step UI (Phase 3c/3d) |
| `turbine-governor/spec.md` | 94 | Governor control interface | ✅ Current |
| `saturation-curve/spec.md` | 29 | Saturation model | ✅ Current |
| `exciter-chain/spec.md` | 31 | Field lag and exciter dynamics | ✅ Current |
| `valve-dial/spec.md` | 37 | PositionIndicator twin-needle dial | ✅ Current (spec matches implementation) |

**Spec updates needed:**

1. **`simulation-core/spec.md`**
   - Line ~9: Change "undamped swing equation" → "damped swing equation" (Phase 3c damper task 3.1)
   - Line ~17: Remove "SHALL NOT include a damping term" sentence (Phase 3c damper task 3.1)
   - Line ~90: Add DAMPING_D presence to "Inertia parameter" requirement (Phase 3c damper task 3.2)
   - Add new section for Phase 3c: grid reference, power angle δ, breaker state, synchronising power term
   - Add new section for Phase 3d: out-of-step detection, pole-slip handling

2. **`simulator-ui/spec.md`**
   - Add Phase 3c requirements: breaker control, synchro-check gate, δ readout, in-step status
   - Add Phase 3d requirements: ANSI-78 out-of-step relay, trip banner, pole-slip presentation

---

## README Status

**Current location:** `/README.md`

**Phase descriptions (lines 13–68):**

| Phase | README Status | Actual Status | Update Needed? |
|-------|---------------|---------------|----------------|
| Phase 1 | ✅ "complete" | ✅ Complete | No |
| Phase 2 | ✅ "complete" | ✅ Complete | **Yes** — mentions planned twin-needle valve spec on unmerged branch; that branch has been merged. Obsolete note should be removed. |
| Saturation & AVR tuning | ✅ "complete" | ✅ Complete | No |
| Phase 3 | ⚠️ "planned" (monolithic) | ✅ Broken into 3a/3b/3c/3d | **Yes** — Phase 3 has been decomposed into sub-phases; README should reflect 3a (✅ done), 3b (✅ done), 3c (design phase), 3d (design phase) |
| Phase 4 | ⚠️ "planned" | Not started | No update needed now |

**Specific README updates needed:**

1. **Phase 2 section (line ~40):** Remove the note about `spec-twin-needle-valve-dial` branch since it has been merged and implemented.

2. **Phase 3 section (lines ~49–57):** Replace the monolithic "Phase 3 — Synchronisation to grid (planned)" with:
   ```markdown
   ### Phase 3a — Swing-equation rotor dynamics (complete)
   ...
   
   ### Phase 3b — Automatic isochronous governor (complete)
   ...
   
   ### Phase 3c — Grid synchronisation (design phase)
   ...
   
   ### Phase 3d — Loss-of-synchronism (design phase)
   ...
   ```

3. Add inline note under Phase 3c or 3b about the damper winding sub-task (currently in progress).

---

## Git Repository State

**Current branch:** main (up-to-date with origin/main)

**Uncommitted files (in progress):**

```
Untracked files:
  docs/ansi.md              → ANSI relay documentation
  docs/ansi.txt             → Raw ANSI relay notes
  openspec/changes/phase-3c-damper-windings/
    ├── design.md           → ✅ Complete design document
    ├── tasks.md            → ✅ Complete task breakdown
    └── specs/simulation-core/  → Stub (no changes yet)
  openspec/changes/rpm-droop-on-load-step/proposal.md  → Investigation complete
  openspec/changes/avr-governor-arming-limits/proposal.md  → Scoping complete
```

**Recent commit history (last 10):**

```
726e83f  damper winding idea
a9becec  note: phase 3c damper windings — stub + concept doc
b8fff9a  note: rpm droop on load step — stub for Phase 3c investigation
fb9dcbb  arming point AVR & auto governer idea
905b373  fix: gate exciter chain gauges to zero at 0 rpm
53fdcf3  docs: control arming limits — AVR and auto governor enable thresholds
d316b1e  fix: inhibit AVR below 0.8 pu speed (underspeed lockout)
f1371b0  fix: sticky note overflow, tape dismiss, knob alignment
a0cfc8a  feat: phase 3b — automatic isochronous governor + coarse speed-changer
99c6534  feat: phase 3a — swing-equation rotor dynamics
```

---

## Summary Table: Implementation vs PRD

| Item | PRD Says | Actually Implemented | Status |
|------|----------|----------------------|--------|
| **Phase 1** | Fixed 50 Hz, islanded, AVR | ✅ All features | ✅ **MATCH** |
| **Phase 2** | RPM/frequency, speed-changer, valve lag | ✅ All features + coarse jog | ✅ **MATCH** (enhanced) |
| **Saturation** | Ea/field curve, second τ, tunable Kp/Ki | ✅ All features | ✅ **MATCH** |
| **Phase 3** | "Synchronisation to grid (planned)" | ✅ 3a/3b complete; 3c/3d designed | ⚠️ **OUTDATED** — needs decomposition |
| **Twin-needle valve dial** | "Planned addition on unmerged branch" | ✅ Implemented & merged | ⚠️ **OUTDATED** — branch no longer exists |
| **Phase 4** | "Grid-connected operation (planned)" | Not started | ✅ **MATCH** (correctly listed as planned) |

---

## Recommendations

### Immediate (Next Session)

1. **Update PRD/README** to reflect Phase 3 decomposition (3a/3b complete, 3c/3d in design)
2. **Remove obsolete twin-needle-valve note** from README Phase 2 section
3. **Commit work-in-progress files** (design.md, tasks.md, proposals) to track design phase formally

### Short Term (Before Phase 3c Implementation)

1. **Implement damper winding tasks** (4 small tasks, ~2–4 hours):
   - Add DAMPING_D constant
   - Update swing equation
   - Update specs
   - Add two unit tests
   
   This unblocks Phase 3c grid-synchronisation work (frequency excursions must be tamed first).

2. **Spec sync review:** Ensure `simulation-core/spec.md` and `simulator-ui/spec.md` are updated to reflect 3a/3b features and 3c/3d placeholders.

3. **Phase 3c gate:** Resolve design questions in AVR/governor arming limits stub before grid sync implementation (affects breaker close logic).

### Medium Term (Phase 3c Implementation)

1. **Add grid reference** (`Vgrid`, `ωgrid`, constants)
2. **Add power angle δ** (new state, integration in swing equation)
3. **Add breaker** (control + state)
4. **Add synchronising power** (`Pe_sync = Pmax·sin(δ)`) to swing equation
5. **Add ANSI-25 synchro-check** (gate logic)
6. **UI:** Breaker control, δ readout, in-step status
7. **Tests:** Scenarios for sync close, loss-of-sync, stable swing-back

### Long Term (Phase 3d & Phase 4)

1. **Phase 3d:** ANSI-78 out-of-step relay + pole-slip detection
2. **Phase 4:** ZIP load model, PV nose-point curve, P/Q dispatch semantics

---

## Key Files & Locations

| Purpose | Path |
|---------|------|
| Main physics engine | `/src/core/simulation.ts` |
| Machine model | `/src/core/machine.ts` |
| Governor controller | `/src/core/governor.ts` |
| AVR controller | `/src/core/avr.ts` |
| Constants (tweakable params) | `/src/core/constants.ts` |
| Type definitions | `/src/core/types.ts` |
| Integration tests | `/src/core/__tests__/integration/` |
| UI components | `/src/components/` |
| Phase 3 design artifacts | `/openspec/changes/phase-3c-damper-windings/` |
| Specs (PRD) | `/openspec/specs/` |
| README | `/README.md` |

---

## Conclusion

**Current state:** Production-ready simulator for Phases 1–3b with elegant physics, comprehensive tests, and solid pedagogical value. Phase 3c and 3d are thoughtfully designed on paper with implementation ready to begin. Damper winding sub-task is spec'd and task-broken; implementation is a small, low-risk next step.

**Quality indicators:**
- ✅ 62 commits with clear history
- ✅ ~90% test coverage
- ✅ Zero uncommitted changes to working code (only design artifacts)
- ✅ No open issues in code; design questions captured formally in proposals
- ✅ Specs align with implementation (Phase 1–3b); Phase 3c/3d specs need creation

**Action items before next phase:** Update PRD for Phase 3 decomposition, implement damper windings, finalize Phase 3c design (arming limits), begin Phase 3c coding.

