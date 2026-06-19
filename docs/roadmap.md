# Synchronous Generator Simulator — Project Roadmap

## Overview

An interactive single-page React application that simulates the power plant of a ship. The goal is educational: to build a deep, intuitive understanding of how a realistic synchronous generator behaves — from a single islanded unit keeping the lights on, to multiple units running in parallel on the ship's internal grid, to the synchronisation procedure required before a standby unit can join.

Parameters are chosen to reflect a real machine, not a textbook toy. Physics are honest but not academically exhaustive.

## Machine Context

The simulated vessel is a **harbour tug** with **two identical 1 MVA generators**. The tug operates its own **isolated internal grid**: no shore connection, no infinite bus. The generators are the grid.

| Property | Value | Rationale |
|---|---|---|
| Rated power per unit | 1 MVA | Typical harbour tug auxiliary |
| Total installed | 2 x 1 MVA | Redundancy + load matching |
| Rated voltage | 400 V L-L | Standard marine LV distribution |
| Rated frequency | 50 Hz | European / international standard |
| Normal operating range | 40-70 % per unit | Oversized for towing and thruster peaks |
| Connection | Tug's isolated grid | No external grid |

**Why a harbour tug?** The tug is the ideal teaching environment:
- Small enough that 1 MVA per unit is entirely realistic
- The grid is isolated and fully visible — no hidden infinite bus absorbing disturbances
- Load events are discrete and relatable: towing winch, bow thruster, hotel load
- A blackout during a towing operation is immediate and consequential
- Two generators means synchronisation happens between machines you understand, not to an abstraction

**Why two units?** Load management on a tug is a real decision: one unit at 65% is more fuel-efficient than two at 30%. The load management system starts the second unit when demand rises, syncs it in, and shares load — then reverses when demand drops. This gives two distinct teaching scenarios with clear boundaries:

| Scenario | Description |
|---|---|
| **Manual unit, auto reference** | Generator 2 runs automatically and owns the grid frequency. The learner operates Generator 1 and must sync to it before closing its breaker. |
| **Auto unit, manual reference** | Generator 1 is the running reference. Generator 2 starts automatically, and the learner watches the sync and parallel operation. |

**Why 40-70 % operating range?** Tug generators are intentionally oversized so that bow thruster starts and towing load peaks stay within headroom. Operating near 100 % is an emergency condition.

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

Six-column switchboard panel, three rows. Columns are fixed-width (138 px); responsive breakpoints scale them down at 960 / 820 / 540 px. No stacked mobile layout — the grid stays 6-wide and shrinks.

**Title bar:** `SYNCHRONOUS GENERATOR · 400 V · 50 Hz · 1 MVA · ISLANDED`
**Footer:** `PHASE 3B · 400 V · 50 Hz · 1 MVA · ISLANDED · AUTO GOVERNOR + AVR`

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ AC OUT   │ RECT DC  │ MAIN FLD │ TERM. Vt │ ACTIVE P │ VALVE    │
│ (Gauge)  │ (Gauge)  │ (Gauge)  │ (Gauge)  │ (Gauge)  │ (PositionIndicator) │
├──────────┼──────────┴──────────┴──────────┼──────────┼──────────┤
│ EXCITER  │  StatusDisplay / LCD                       │ ACTIVE   │ FINE     │
│ FIELD    │  (spans cols 2–4)                          │ LOAD     │ (SpringLoadedSelector) │
│ (Knob)   │                                            │ (Knob)   │          │
├──────────┼──────────┬──────────┬──────────┼──────────┼──────────┤
│ Indicator│ Indicator│ AVR      │ 27 RELAY │ POWER    │ COARSE   │
│ Lights   │ Lights   │ (Selector│ reset    │ FACTOR   │ (SpringLoadedSelector) │
│ (top 4)  │ (bot 4)  │  Switch) │ button   │ (Knob)   │ GOVERNOR │
│          │          │          │          │          │ (SelectorSwitch) │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Controls** are `Knob` components (not sliders): Exciter Field DC, Active Load, Power Factor.
**Switches** are `SelectorSwitch` components: AVR on/off, Governor on/off.
**Governor speed-changer** is a `SpringLoadedSelector` (fine and coarse, col 6).
**Valve position** is a `PositionIndicator` (twin-needle: setpoint + actual).
**StatusDisplay** is an LCD-style panel showing numeric readouts (Q, δ, PF, RPM, Hz, etc.).
**IndicatorLights** shows armed/tripped/ceiling status for AVR, governor, and relays.

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

### Phase 2 — RPM / Frequency control ✓ complete
**Prerequisite:** Phase 1 complete

> **Design insight:** speed is not commanded as "Hz". The operator commands the **intake
> valve** (0–100 %), and the shaft produces RPM; Hz is a derived readout. 0 % = closed = 0 rpm;
> 100 % = 1600 rpm (overspeed trip). Rated speed (1500 rpm) sits at ~93.75 % valve — almost fully
> open at rated load, which matches real plant operation. The sim starts at ~93.1 % valve (~1495 rpm,
> slightly sub-synchronous). RPM is the headline readout; Hz sits beside it. Shaft run-up from rest
> is deferred to Phase 3. See `phase-2-rpm-frequency-control` change (archived) for the full design.

- Added **turbine governor speed-changer** — a spring-return raise/lower switch (two-stage slow/fast)
  that drives the intake valve (0–100 %, where 0 % = closed = 0 rpm, 100 % = 1600 rpm overspeed)
- Rotor speed scales internal EMF (`Eₐ = field × speed_pu`), so a speed change moves both frequency and
  voltage; a kinematic spin-up lag (τ ≈ 2.5 s) makes the shaft ease to the new speed
- Added **RPM** (headline) and **Hz** readouts, plus a valve-position readout; sim starts at ~1495 rpm
- Key learning: frequency and voltage are independent — turbine controls P/frequency, exciter controls voltage/Q
- This separation is the foundation needed before grid connection

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
closes the ship load in a single step (no ramp). The machine must absorb the full Pe jump on inertia
alone while the governor races to raise Pm. Too large a step = frequency collapse and stall.
Key learning: why tug generators are oversized, what `H` and `TAU_VALVE` mean in practice, and why
governor response speed matters more than steady-state accuracy.

Correction from Phase 3 assumptions: `TAU_VALVE` will be revised from 2.0 s (steam plant) to ~0.3 s
(diesel throttle) to reflect the tug generator reality.

**UI changes bundled with Stage 3d** (LCD layout is being revised for this stage anyway):

- **Throttle display revision**: remove `PositionIndicator` from the panel layout (keep the component — may serve synchroscope or steam variant). At TAU_VALVE ~0.3 s the twin needles are nearly coincident and the instrument loses its educational value. Add throttle % (`valveActual`) as an LCD tile instead — shows the operator where the governor is commanding the fuel rack.
- **Damping torque LCD tile**: expose `dampingTorque = D · (ω − ωref)` on `Outputs` and add an LCD tile for it. Shows the learner that the damper produces zero torque at steady state and a spike proportional to slip during a load step — contrast with AVR/governor which are active loops.

**Startup sequence and arming logic** (already implemented — surfaced as a teaching point here):
The cold-start sequence makes the arming logic visceral and observable:

1. Engine starts → shaft spins up from 0 rpm (cold-dark preset)
2. Below **~1200 rpm (0.8 pu)** — AVR inhibited, governor inhibited; field cannot build, no frequency
   control. The operator can only watch the shaft accelerate.
3. At **~1200 rpm** — AVR arms; field can now be raised and terminal voltage builds
4. At **~1500 rpm (rated)** — governor can engage; frequency regulation becomes available
5. Load breaker closes — machine carries the ship load

This mirrors real diesel generator startup procedure: the machine must reach idle speed before any
electrical or control systems are permitted to operate. The arming thresholds are a safety feature,
not a software convenience.

#### Governor PID sliders (standalone — natural fit after Stage 3d)
**One concept: plant constraints on controller tuning.** Expose `GOV_KP` and `GOV_KI` as adjustable inputs, mirroring the AVR pattern (ranges, defaults, labels). With TAU_VALVE ~0.3 s the learner can feel the tradeoff between recovery speed and overshoot, and see that the plant lag sets a hard ceiling on how aggressive the controller can be. Well-tuned starting defaults: `GOV_KP ≈ 20`, `GOV_KI ≈ 2` (current hard-coded values are aggressive and produce visible hunting). Teaching parallel: the derivative term does for control what the damper winding does mechanically — looks ahead and backs off before overshoot occurs.

#### Stage 3e — Overvoltage protection and load shedding
**One concept: protection responding to two failure modes.** Adds two relays:
- **ANSI-59 (overvoltage)**: when the load breaker opens (load rejection), Pm suddenly exceeds Pe and
  voltage spikes as the rotor accelerates. The 59 trips the field if Vt exceeds its threshold, protecting
  insulation. Natural companion to the existing ANSI-27.
- **ANSI-81 (under-frequency)**: when frequency falls below threshold (e.g. 48.5 Hz), the ship's load
  management system automatically sheds non-essential consumers to prevent a blackout.

Key learning: protection as a last line of defence; why load rejection is as dangerous as overload;
why load hierarchy matters on a ship.

#### Arming limits design (design work — before Phase 4)
Before Phase 4 adds grid connection and synchronisation, the arming logic needs a review pass. Current state: single hard threshold `OMEGA_AVR_ENABLE = 0.8 pu`; no governor equivalent; no UI feedback when a regulator is toggled on but inhibited.

Questions to resolve:
- **Hysteresis**: arm AVR at 0.82 pu, disarm at 0.78 pu to prevent chattering at the boundary?
- **Governor underspeed lockout**: without one, the governor integral winds up toward 100 % valve before the machine is spinning — add `OMEGA_GOV_ENABLE`?
- **Inhibit indicator**: when AVR or governor is toggled on but blocked by underspeed, show "AVR INHIBITED" / "GOV INHIBITED" (distinct from "AVR ACTIVE") so the arming state is legible.
- **Phase 4 interaction**: the AVR must be armed before a breaker closes onto a live grid — verify arming logic is compatible with sync scenarios.
- **Volts-per-Hz (ANSI-24) over-speed excitation limit** — out of scope for Phase 3 but flag here for Phase 4 design.

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

#### Stage 4c — Droop, load sharing, and reverse power protection
**One concept: parallel load sharing.** With two units running, the governor changes from isochronous
(holds exact frequency alone) to droop mode (shares load proportionally). Each machine's governor
droops its frequency setpoint as load increases, forcing automatic sharing. Key learning: why droop is
essential for parallel operation and why two isochronous governors fight each other.

Adds **ANSI-32 (reverse power)**: if one unit's governor fails or its fuel supply is cut while
paralleled, it stops producing and starts motoring — drawing power from the other unit and spinning
its engine backwards. The 32 relay detects negative active power and trips that unit's breaker before
the engine is damaged. Only meaningful in parallel operation, so this is the correct stage for it.

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