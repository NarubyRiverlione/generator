# PRD: Synchronous Generator Simulator

## Overview

An interactive single-page React application that simulates the power plant of a ship. The goal is educational: to build a deep, intuitive understanding of how a realistic synchronous generator behaves — from a single islanded unit keeping the lights on, to multiple units running in parallel on the ship's internal grid, to the synchronisation procedure required before a standby unit can join.

Parameters are chosen to reflect a real machine, not a textbook toy. Physics are honest but not academically exhaustive.

## Machine Context

The simulated machine is a **1 MVA ship's generator** — one of several units in a vessel's power plant. The ship operates its own **isolated internal grid**: no shore connection, no infinite bus. The generators are the grid.

| Property | Value | Rationale |
|---|---|---|
| Rated power | 1 MVA | Mid-size vessel auxiliary unit |
| Rated voltage | 400 V L-L | Standard marine LV distribution |
| Rated frequency | 50 Hz | European / international standard |
| Normal operating range | 40–70 % of rated | Intentional oversizing for load spikes |
| Connection | Ship's isolated grid | No external grid |

**Why a ship?** The ship's power plant is the ideal teaching environment:
- The grid is isolated and fully visible — no hidden infinite bus absorbing disturbances
- New consumers (bow thruster, crane, galley load) are discrete, sudden, and relatable
- A blackout is immediate and consequential — the stakes are tangible
- Multiple generators must sync to each other, not to an abstraction
- Maritime engineers learn exactly this way

**Why 40–70 % operating range?** Ship generators are intentionally oversized. A vessel needing 600 kW of hotel load runs a 1 MVA unit so that bow thruster starts, crane picks, and galley peaks stay within headroom. Operating near 100 % is an emergency condition.

> **Branch point — utility grid variant:** the codebase at git tag `islanded-baseline` is the
> intended starting point for a future utility-scale simulator (infinite bus, power station unit,
> grid operator context). That variant follows a different operational philosophy and should branch
> from that tag rather than extending this line.

---

## Learning Philosophy

**One concept at a time.** Each phase and each feature addition targets a single new concept. A new parameter or behaviour is only introduced once the previous one is understood and has had time to settle mentally. This is not a race to feature completeness — it is a deliberate, step-by-step path from basic exciter/voltage relationships through to full grid-connected operation.

Do not add multiple new physical effects in the same iteration. If something is interesting but not the current focus, log it for a future phase and move on.

---

## Goals

- Build intuition for the parameters of a realistic European synchronous generator
- Understand each parameter — what it represents physically, what it affects, and what a realistic value looks like — before moving to the next
- Make the impact of load (active and reactive) on terminal voltage tangible
- Show the difference between operating with and without AVR regulation
- Keep the physics honest but not academically exhaustive — no edge cases, no fault simulation

---

## Tech Stack

- React (functional components + hooks)
- No UI library — plain CSS or Tailwind utility classes
- No charting library for MVP — gauges are SVG arcs built inline
- All simulation logic in a custom hook (`useGeneratorSimulation`)

---

## Simulation Model

### Approach

Steady-state phasor model (per-phase equivalent circuit) with a first-order time lag on exciter response. When an input changes, the output values settle toward their new steady-state over a configurable time constant rather than snapping instantly.

### Core Equation

```
Eₐ = Vₜ + Iₐ · (Rₐ + jXₛ)
```

Where:
- `Eₐ` — internal excitation voltage (driven by field voltage input)
- `Vₜ` — terminal voltage (primary readout)
- `Iₐ` — armature current (derived from load inputs)
- `Rₐ` — stator resistance (fixed, small — can be near-zero for MVP)
- `Xₛ` — synchronous reactance (fixed parameter)

### Derived outputs

```
P = (3 · Vₜ · Eₐ / Xₛ) · sin(δ)
Q = (3 · Vₜ · Eₐ / Xₛ) · cos(δ) − (3 · Vₜ² / Xₛ)
```

### Time dynamics

Apply a first-order lag (exponential settling) to exciter field current:

```
Ifield(t) = Ifield_target · (1 − e^(−t / τ))
```

Default time constant `τ = 1.5s`. Drive the simulation with `requestAnimationFrame` or a `setInterval` at ~30ms.

### AVR (optional, toggle)

When AVR is enabled, a simple proportional-integral controller adjusts the field voltage setpoint automatically to hold `Vₜ` at the reference voltage. The AVR acts on the error `ΔV = Vₜ_ref − Vₜ`. AVR gain and integration time are fixed internally — not exposed as user inputs.

---

## Fixed Parameters (not user-facing)

| Parameter | Value | Notes |
|---|---|---|
| Rated voltage (Vₙ) | 400 V (line-to-line) | Base reference |
| Rated frequency | 50 Hz | European standard |
| Stator resistance (Rₐ) | 0.05 pu | Near-negligible |
| Exciter time constant (τ) | 1.5 s | Controls settling speed |
| Rated MVA | 1 MVA | Scales all power readouts |

All values work in per-unit internally. Display is converted to real units (V, Hz, kW, kVAR).

---

## User Inputs

All inputs are sliders with a numeric label showing the current value.

| Input | Range | Default | Unit |
|---|---|---|---|
| Exciter field DC | 0.5 – 1.5 | 1.0 | pu |
| Active load (P) | 0 – 100 | 50 | % of rated |
| Power factor | 0.6 lag – 1.0 – 0.6 lead | 0.85 lag | — |
| AVR enable | off / on | off | toggle |

**Fixed (not user controls):** synchronous reactance Xₛ = 1.2 pu and armature resistance Rₐ = 0.05 pu
are machine properties; the AVR voltage reference is fixed at rated (1.0 pu / 400 V). Rotor speed is
fixed at 50 Hz / 1500 RPM in Phase 1.

---

## Readouts

The readouts are deliberately ordered to mirror the physical signal chain — user can follow the energy from exciter input through to stator output.

All readouts update continuously as the simulation settles. Show current value and a subtle animation while settling.

### Exciter chain (left to right / top to bottom)

| Readout | Unit | Display | Notes |
|---|---|---|---|
| Exciter AC output | V | Numeric | Result of exciter field DC × rotor speed |
| Rectified DC to field windings | V | Numeric | Fixed ratio from exciter AC, rectifier efficiency applied |
| Main rotor field current | A | Numeric | Drives the rotating magnetic field strength |

### Generator output

| Readout | Unit | Display | Notes |
|---|---|---|---|
| Terminal voltage (Vₜ) | V | Gauge + numeric | Primary output readout |
| Active power (P) | kW | Gauge + numeric | |
| Reactive power (Q) | kVAR | Numeric (+ / − with label) | Label as "supplying" / "absorbing" |
| Load angle (δ) | degrees | Numeric | Warning when approaching 90° |
| Power factor (calculated) | — | Numeric | |

### Gauge design

Simple SVG arc gauge — 270° sweep, coloured fill based on value relative to rated. No external library. Three zones: green (normal), amber (±15% of rated), red (±25% of rated).

---

## Layout

Single page, two-column on desktop, stacked on mobile. Readouts are ordered to follow the physical signal chain top to bottom.

```
┌─────────────────────────────────────────┐
│  Header: "Generator Simulator"           │
├──────────────────┬──────────────────────┤
│  INPUTS          │  EXCITER CHAIN       │
│                  │                      │
│  Exciter field ──│── Exciter AC out     │
│  DC (slider)     │── Rectified DC       │
│                  │── Field current      │
│  Active load   ──│                      │
│  Power factor    │  GENERATOR OUTPUT    │
│  AVR toggle    ──│── Vₜ gauge           │
│                  │── P gauge            │
│                  │── Q / δ / PF        │
└──────────────────┴──────────────────────┘
```

---

## Behaviour Notes

- When AVR is toggled **on**: exciter field DC becomes read-only and shows the value AVR is currently commanding. The AVR reference is fixed at rated (1.0 pu / 400 V) — not user-adjustable in the shipped build.
- When load increases with AVR **off**: terminal voltage drops visibly — this is the key learning moment.
- When load increases with AVR **on**: exciter field DC rises automatically, the entire chain (exciter AC → rectified DC → field current) moves to compensate, Vₜ stays near reference. User can watch the chain react.
- Reactive power (Q) goes **negative** when load is capacitive (leading PF) — label this clearly as "absorbing" vs "supplying".
- Load angle (δ) approaching 90° should show a warning — this is the stability limit.
- Rotor speed and frequency are fixed at 50 Hz / 1500 RPM — no readout needed for MVP.

---

## Out of Scope (MVP)

- Magnetic saturation curve ← **deferred to the Saturation & AVR-tuning change** (see roadmap)
- Second field time constant (AVR ringing) ← **deferred to the Saturation & AVR-tuning change**
- Transient / sub-transient reactances
- Short circuit or fault simulation
- Grid-connected (infinite bus) mode
- Multiple generators in parallel
- Harmonics
- Visual theming / polished design
- RPM / frequency variation ← **deferred to Phase 2**

---

## Product Roadmap

Phases build on each other — concepts from earlier phases are prerequisites for later ones. Do not skip ahead.

### Phase 2 — RPM / Frequency control
**Prerequisite:** Phase 1 complete
**Status:** Spec and design complete — implementation not yet started

> **Design insight (post-PRD):** speed is not commanded as "Hz". The operator commands the **intake
> valve** (0–100 %), and the shaft produces RPM; Hz is a derived readout. 0 % = closed = 0 rpm;
> 100 % = 1600 rpm (overspeed trip). Rated speed (1500 rpm) sits at ~93.75 % valve — almost fully
> open at rated load, which matches real plant operation. The sim starts at ~93.1 % valve (~1495 rpm,
> slightly sub-synchronous). RPM is the headline readout; Hz sits beside it. Shaft run-up from rest
> is deferred to Phase 3. See `phase-2-rpm-frequency-control` change (archived) for the full design.

- Add a **turbine governor speed-changer** — a spring-return raise/lower switch (two-stage slow/fast)
  that drives the intake valve (0–100 %, where 0 % = closed = 0 rpm, 100 % = 1600 rpm overspeed)
- Rotor speed scales internal EMF (`Eₐ = field × speed_pu`), so a speed change moves both frequency and
  voltage; a kinematic spin-up lag (τ ≈ 2.5 s) makes the shaft ease to the new speed
- Add **RPM** (headline) and **Hz** readouts, plus a valve-position readout; sim starts at ~1495 rpm
- Key learning: frequency and voltage are independent — turbine controls P/frequency, exciter controls voltage/Q
- This separation is the foundation needed before grid connection

> **Planned addition (branch `spec-twin-needle-valve-dial`):** a twin-needle dial gauge as the
> primary readout for intake valve position — spec exists on that branch, not yet merged into main.

### Saturation & AVR tuning (standalone — unscheduled)
**Prerequisite:** Phase 2 complete (saturation scales the same Eₐ that speed scales)

Originally drafted inside Phase 2, carved out as the `avr-tuning-and-saturation` change because it
concerns the *voltage* channel, not rotor speed. Slot into the roadmap when desired.

- Magnetic saturation: Eₐ/field curve flattens above ~1.1 pu field; reveals AVR ceiling under heavy load and why over-excitation has diminishing returns
- Second field time constant: stack τ_exciter + τ_field so the step response can overshoot and ring
- Kp/Ki become user-adjustable so tuning against the now-second-order, saturating plant is meaningful

### Phase 3 — Synchronisation to grid
**Prerequisite:** Phase 2 complete

Phase 3 turns the rotor from a *kinematically-driven* shaft into a *dynamic body with inertia that can
fall out of step*. Following the "one concept at a time" rule, it is split into four sequential stages,
each its own OpenSpec change. Manual synchroscope artistry (hand-matching V/f/phase before close) is
**deprioritised** — the breaker may close automatically once conditions are roughly met; the pedagogy
moves to *staying in step* and *what happens when you don't*.

#### Stage 3a — Rotor swing dynamics (`phase-3a-rotor-swing-dynamics`)
**One concept: rotor inertia.** Replace the Phase 2 kinematic speed lag with the swing equation
`2H·dω/dt = Pm − Pe`. The valve now commands **mechanical power in (Pm)**, not speed directly; speed
*emerges* from the power balance. Adds shaft **run-up from rest** (0 → 1500 rpm) and the inertia
constant `H`. Islanded only — no grid yet. Load steps now cause frequency to **dip, swing, and
require the operator to rebalance** (constant-power load gives no self-regulation, so a fixed valve has
no stable frequency after a load step — the operator must act). This is the foundation for everything
after it.

#### Stage 3b — Automatic governor (`phase-3b-automatic-governor`)
**One concept: closed-loop frequency regulation.** The exact twin of the AVR: a default-off governor
that senses speed error `(ωref − ω)` and commands the valve (Pm) to hold 50 Hz, mirroring how the AVR
holds Vt. When on, the speed-changer goes read-only and shows the commanded value; a governor-at-ceiling
indicator mirrors the field-at-ceiling one. Isochronous (restores exactly 50 Hz) — droop-mode sharing
is a Phase 4 concern. The learner first holds frequency by hand (Stage 3a), then lets the regulator do
the chase.

#### Stage 3c — Damper windings (`phase-3c-damper-windings`) ✓ complete
**One concept: passive rotor stabilisation.** Added `D·(ω − ωref)` to the swing equation. Effect is
subtle on an islanded constant-power load (no oscillation to damp), but is prerequisite for parallel
operation where the inter-machine coupling introduces oscillatory torque.

#### Stage 3d — Cold-start load pickup
**One concept: instantaneous load step onto an islanded machine.** Add a **load breaker** button that
closes the building/ship load in a single step (no ramp). The machine must absorb the full Pe jump on
inertia alone while the governor races to raise Pm. Too large a step = frequency collapse and stall.
Key learning: why backup generators are oversized, what `H` and `TAU_VALVE` mean in practice, and why
the governor speed matters more than its steady-state accuracy.

Correction from Phase 3 assumptions: `TAU_VALVE` will be revised from 2.0 s (steam plant) to ~0.3 s
(diesel/gas fuel rack) to reflect the ship generator reality.

#### Stage 3e — Frequency collapse and load shedding
**One concept: automatic load dropping under under-frequency.** When frequency falls below a threshold
(e.g. 48.5 Hz), the ship's load management system automatically sheds non-essential consumers to
prevent a blackout. Adds an under-frequency relay (ANSI-81) and a priority-ordered load shed sequence.
Key learning: protection as a last line of defence, and why load hierarchy matters on a ship.

### Phase 4 — Ship's parallel operation
**Prerequisite:** Phase 3 complete

A second generator joins the ship's internal grid. This is where synchronisation finally appears —
but to *another machine just like this one*, not to an abstract infinite bus.

#### Stage 4a — Second generator startup
Run a second unit up to speed and voltage alongside the first. The first generator is the reference —
it owns the ship's frequency and voltage. The second must match before its breaker can close.

#### Stage 4b — Synchronisation to the ship's grid
**One concept: syncing to a live internal grid.** Add a synchroscope showing phase angle difference
between the incoming unit and the running grid. A synchro-check (ANSI-25) gate guards the close.
Closing into a large mismatch produces a visible rotor swing — now the damper winding's effect becomes
dramatic and unmistakable.

#### Stage 4c — Droop and load sharing
**One concept: parallel load sharing.** With two units running, the governor changes from isochronous
(holds exact frequency alone) to droop mode (shares load proportionally). Each machine's governor
droops its frequency setpoint as load increases, forcing automatic sharing. Key learning: why droop is
essential for parallel operation and why two isochronous governors fight each other.

#### Stage 4d — Consumer-triggered standby start
**One concept: automatic load management.** A large new consumer (bow thruster, crane) triggers
automatic startup of the standby generator, synchronisation, and breaker close — the full sequence
automated. Key learning: the load management controller as the brain of the ship's power plant.

---

## Suggested File Structure

```
/src
  /hooks
    useGeneratorSimulation.ts   ← all physics + time stepping
  /components
    InputPanel.tsx
    ExciterChain.tsx            ← new: shows AC out, rectified DC, field current
    ReadoutPanel.tsx
    Gauge.tsx
    AvrControl.tsx
  App.tsx
  index.css
```

---

## Acceptance Criteria

- [ ] Changing exciter field DC slider causes the full chain to settle: exciter AC → rectified DC → field current → Vₜ, over ~1.5s
- [ ] Increasing active load with AVR off causes Vₜ to drop
- [ ] Increasing active load with AVR on causes exciter field DC to rise automatically, holding Vₜ near reference
- [ ] All three exciter chain readouts move when exciter field DC changes
- [ ] Leading power factor load causes Q to go negative, labelled "absorbing"
- [ ] Load angle (δ) increases with increasing load, warning shown near 90°
- [ ] All gauges update smoothly without jank
- [ ] Works on mobile (stacked layout)

---

## Notes for Claude Code

- **Never start implementing without explicit confirmation.** The user plans deliberately — proposal, design, written tasks — before any code is written.
- **One concept at a time.** Do not bundle multiple new physical effects into a single change, even if they seem related. Each new parameter or behaviour gets its own iteration so the user has time to understand it.
- **Parameters target a realistic European generator.** When choosing defaults or ranges, prefer values representative of a real 50 Hz machine, not textbook extremes.
- Build and validate `useGeneratorSimulation` first before touching UI
- The per-unit system is intentional; convert to real units only at display time
- The exciter chain readouts (AC out, rectified DC, field current) are derived values — fixed ratios from the exciter field DC input, with the time lag applied
- If asked about AVR PID values: `Kp = 2.0`, `Ki = 0.5`
- The stability warning at δ → 90° is a key teaching moment — keep even if just a text label