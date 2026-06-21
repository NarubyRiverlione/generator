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

- Vite + React + TypeScript (functional components + hooks)
- No UI library — plain CSS (`src/styles/*.css`)
- No charting library — gauges and instruments are hand-rolled SVG
- All physics in `src/core/` as pure functions (no React); `useGeneratorSimulation` orchestrates the time-stepping
- pnpm package manager; Vitest for tests

---

## Simulation Model

### Approach

Steady-state phasor model (per-phase equivalent circuit) with a first-order time lag on exciter response. When an input changes, the output values settle toward their new steady-state over a configurable time constant rather than snapping instantly.

### Core Equation

```
Eₐ = Vₜ + Iₐ · (Rₐ + jXₛ)
```

Where:
- `Eₐ` — internal excitation voltage. Since Phase 2 + saturation: `Eₐ = saturation(field_lagged) × speed_pu`, so it scales with both rotor speed and the non-linear field characteristic
- `Vₜ` — terminal voltage (primary readout)
- `Iₐ` — armature current (derived from load inputs)
- `Rₐ` — stator resistance (fixed, 0.05 pu)
- `Xₛ` — synchronous reactance (fixed, 0.8 pu)

### Derived outputs

```
P = (3 · Vₜ · Eₐ / Xₛ) · sin(δ)
Q = (3 · Vₜ · Eₐ / Xₛ) · cos(δ) − (3 · Vₜ² / Xₛ)
```

### Time dynamics

The field path now uses **two stacked first-order lags** (added in the saturation & AVR-tuning change),
so the AVR step response can overshoot and ring: the exciter output eases toward the field command
with `τ_exciter = 0.4 s`, then the field current eases toward the exciter output with `τ_field = 1.1 s`.

```
exciter(t) → field command   with τ_exciter = 0.4 s
Ifield(t)  → exciter(t)       with τ_field   = 1.1 s
```

The simulation is driven at a fixed timestep (~30 ms). Rotor speed has its own dynamics (Phase 2
kinematic lag, then the Phase 3a swing equation) and the intake valve has its own actuator lag
(`τ_valve`).

### AVR (optional, toggle)

When AVR is enabled, a simple proportional-integral controller adjusts the field voltage setpoint automatically to hold `Vₜ` at the reference voltage. The AVR acts on the error `ΔV = Vₜ_ref − Vₜ`. AVR gain and integration time are fixed internally — not exposed as user inputs.

---

## Fixed Parameters (not user-facing)

Current values as implemented in `src/core/constants.ts` / `units.ts`. All simulation works in
per-unit internally; display is converted to real units (V, Hz, kW, kVAR) only at readout time.

**Machine & bases**

| Parameter | Value | Notes |
|---|---|---|
| Rated voltage (Vₙ) | 400 V (line-to-line) | Base reference |
| Rated frequency | 50 Hz | European standard |
| Rated MVA | 1 MVA | Scales all power readouts |
| Pole count | 4 | → 1500 rpm at 50 Hz |
| Synchronous reactance (Xₛ) | 0.8 pu | Fixed machine property |
| Stator resistance (Rₐ) | 0.05 pu | Near-negligible |

**Excitation / AVR (voltage channel)**

| Parameter | Value | Notes |
|---|---|---|
| Exciter lag (τ_exciter) | 0.4 s | First of two stacked field lags |
| Field winding lag (τ_field) | 1.1 s | Second lag (`PARAMS.tau`) — together they let the AVR step response ring |
| AVR Kp / Ki | 2.0 / 0.5 | PI gains; ship fixed by design — no UI knob (see note below) |
| AVR voltage reference | 1.0 pu / 400 V | Fixed at rated |
| AVR command clamp | 0.5 – 1.7 pu | Field command limits |
| Saturation curve | (0,0) · (1.0,1.0) knee · (1.5,1.2) ceiling | Piecewise-linear open-circuit characteristic |
| ANSI-27 under-voltage trip | 0.85 pu Vₜ | Under-voltage relay threshold |
| AVR arm threshold | 0.80 pu (~1200 rpm) | AVR inhibited below this; `IlluminatedButton` shows amber *(pending merge)* |
| AVR disarm threshold | 0.77 pu (~1155 rpm) | Hysteresis — AVR stays armed until speed drops here *(pending merge)* |

**Rotor / governor (speed channel)**

| Parameter | Value | Notes |
|---|---|---|
| Rated speed | 1500 rpm | Synchronous, 4-pole @ 50 Hz |
| Valve speed at 100 % | 1600 rpm | Overspeed point (~107 % rated) |
| Max mechanical power (Pm_max) | ≈ 1.067 pu | Anchored so Pm = 1.0 pu at the rated valve position (93.75 %) |
| Inertia constant (H) | 4 s | Sets run-up time and frequency-drift rate |
| Damper coefficient (D) | 0.05 pu | Viscous drag ∝ slip; zero at synchronous speed |
| Governor Kp / Ki | 100 / 20 | Isochronous PI; fixed (PID sliders are a planned change) |
| Governor rate limit | 10 %/s | Max valve slew under the governor |
| Governor arm threshold | 0.933 pu (~1400 rpm) | Governor inhibited below idle speed; `IlluminatedButton` shows amber *(pending merge)* |
| Governor disarm threshold | 0.90 pu (~1350 rpm) | Hysteresis — governor stays armed until speed drops here *(pending merge)* |
| Valve actuator lag (τ_valve) | 0.3 s | Diesel fuel rack (revised from 2.0 s steam-plant value in Stage 3d) |
| Fine jog rates | 0.5 / 5 rpm/s | Slow / fast stages of the fine speed-changer |
| Coarse jog rates | 10 / 25 rpm/s | Slow / fast stages of the coarse speed-changer |

> **Note on AVR Kp/Ki:** adjustable gains were implemented in the `avr-tuning-and-saturation` change,
> but a deliberate design decision was made not to expose a Kp/Ki knob in the UI. The AVR gains
> therefore ship fixed at 2.0 / 0.5.

---

## User Inputs

Inputs are physical controls (`Knob`, `SelectorSwitch`, `SpringLoadedSelector`) — not sliders. Each
shows its current value. Defaults below are the shipped **cold-dark** boot preset (machine fully at
rest); the `?start=` URL parameter selects other presets (`spinning-dark`, `live-loaded`).

| Input | Control | Range | Default (cold-dark) | Notes |
|---|---|---|---|---|
| Load breaker | Button | open / closed | open | Closes ship load as single instantaneous step; armed at ≥ 0.95 pu (~1425 rpm) |
| Exciter field DC | `Knob` | 0 – 1.7 pu | 0 | Read-only when AVR on (shows AVR command) |
| Active load (P) | `Knob` | 0 – 120 % | 0 | Fraction of rated |
| Power factor | `Knob` | 0.6 lag – 1.0 – 0.6 lead | 0.92 lag | Signed: lag (inductive) / lead (capacitive) |
| AVR enable | `SelectorSwitch` | off / on | off | Inhibited below ~1200 rpm |
| Governor enable | `SelectorSwitch` | off / on | off | Isochronous PI on speed error → valve |
| Speed-changer (fine) | `SpringLoadedSelector` | ±1 slow / ±2 fast | 0 (spring-return) | Jogs the intake valve; read-only when governor on |
| Speed-changer (coarse) | `SpringLoadedSelector` | ±1 slow / ±2 fast | 0 (spring-return) | Coarse valve jog; read-only when governor on |

**Fixed (not user controls):** synchronous reactance Xₛ = 0.8 pu and armature resistance Rₐ = 0.05 pu
are machine properties; the AVR voltage reference is fixed at rated (1.0 pu / 400 V). Rotor speed is
**no longer fixed** — since Phase 2 it emerges from the valve position (Phase 2 kinematic, Phase 3a+
from the swing equation).

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

**Current state:** Vₜ and active power (P) are `Gauge` instruments; the remaining readouts (Q, δ, RPM,
Hz, plus power balance ΔP, voltage stability margin VSM, saturation SAT, throttle % THR, and damping
torque DMP) live on the `StatusDisplay` LCD with a fault/warning screen and a toggleable legend. The
`PositionIndicator` (twin-needle valve dial) has been removed from the panel (component retained).

### Gauge design

Simple SVG arc gauge — 270° sweep, coloured fill based on value relative to rated. No external library. Three zones: green (normal), amber (±15% of rated), red (±25% of rated).

---

## Layout

Six-column switchboard panel, three rows. Columns are fixed-width (138 px); responsive breakpoints scale them down at 960 / 820 / 540 px. No stacked mobile layout — the grid stays 6-wide and shrinks.

**Title bar:** `SYNCHRONOUS GENERATOR · 400 V · 50 Hz · 1 MVA · ISLANDED`
**Footer:** `PHASE 3D · 400 V · 50 Hz · 1 MVA · ISLANDED · AUTO GOVERNOR + AVR`

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ AC OUT   │ RECT DC  │ MAIN FLD │ TERM. Vt │ ACTIVE P │ LOAD     │
│ (Gauge)  │ (Gauge)  │ (Gauge)  │ (Gauge)  │ (Gauge)  │ BREAKER  │
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
- Rotor speed and frequency are **dynamic** (since Phase 2): the operator commands the intake valve, RPM and Hz emerge and are headline readouts. Voltage stability margin (VSM) and saturation (SAT) are also surfaced on the LCD.

---

## Out of Scope (permanently)

- Transient / sub-transient reactances
- Short circuit or fault simulation
- Grid-connected (infinite bus) mode *(infinite bus variant branches from `islanded-baseline`)*
- Harmonics
- Visual theming / polished design

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

### Saturation & AVR tuning (standalone) ✓ complete

Originally drafted inside Phase 2, carved out as the `avr-tuning-and-saturation` change because it
concerns the *voltage* channel, not rotor speed. See that archived change for the full design.

- Magnetic saturation ✓ — Eₐ/field curve flattens above the knee; reveals AVR ceiling under heavy load and why over-excitation has diminishing returns
- Second field time constant ✓ — τ_exciter + τ_field so the step response can overshoot and ring
- Adjustable Kp/Ki ✓ — implemented in the core, but a deliberate design decision was made **not to expose a Kp/Ki knob** in the UI; the AVR gains ship fixed at 2.0 / 0.5

### Phase 3 — Synchronisation to grid
**Prerequisite:** Phase 2 complete

Phase 3 turns the rotor from a *kinematically-driven* shaft into a *dynamic body with inertia that can
fall out of step*. Following the "one concept at a time" rule, it is split into four sequential stages,
each its own OpenSpec change. Manual synchroscope artistry (hand-matching V/f/phase before close) is
**deprioritised** — the breaker may close automatically once conditions are roughly met; the pedagogy
moves to *staying in step* and *what happens when you don't*.

#### Stage 3a — Rotor swing dynamics (`phase-3a-rotor-swing-dynamics`) ✓ complete
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

#### Stage 3d — Cold-start load pickup ✓ complete
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

#### Arming limits design (`avr-governor-inhibit-buttons`) — implemented, not yet merged
Developed on `claude/governor-throttle-terminology-xh67m7`. Code complete and all tests pass;
awaiting end-to-end testing before merge. Replaces `SelectorSwitch` for both AVR and Governor with
`IlluminatedButton` — amber = inhibited, dark = off, green = active. Governor underspeed lockout
added at idle (0.933 pu). Hysteresis on both thresholds prevents boundary chatter.

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
**OpenSpec change:** `phase-4a-second-generator` — proposal, design, and tasks complete; not yet implemented.

Run a second unit up to speed and voltage alongside the first. Both generators are symmetric — neither
is permanently the reference. Key design decisions (see `openspec/changes/phase-4a-second-generator/`
and `docs/phase-4a-decisions.md`):

- **Two independent simulation instances** on a single shared rAF tick (`useGeneratorState` + one rAF
  loop in App, replacing the per-hook loop). Shared tick keeps phase angles in lockstep for the 4b
  synchroscope.
- **Status strip + tabs**: a ~160 px read-only sidebar always shows RPM, Hz, Vₜ, P, breaker/AVR/GOV
  state for both generators; GEN 1 / GEN 2 tabs switch the full interactive panel. Keyboard shortcuts
  `1` / `2`.
- **START → idle at 1400 rpm → manual nudge to 1500 rpm**: START button (already implemented via
  `engine-start-stop` change) ramps to idle; operator trims the last 100 rpm with the fine
  speed-changer before AVR and governor are both available.
- **Gen 2 always boots cold-dark** regardless of the `?start=` URL preset.
- **STOP force-trips the load breaker** before ramping valve to 0.

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

## File Structure (actual)

```
/src
  /core                         ← all physics, pure functions, no React
    simulation.ts               ← the step() solver
    machine.ts  load.ts  complex.ts
    avr.ts  governor.ts  saturation.ts
    constants.ts  types.ts  units.ts  presets.ts
  /hooks
    useGeneratorSimulation.ts   ← orchestrates time-stepping over core
  /components
    Gauge.tsx                   ← square single-needle instrument
    PositionIndicator.tsx       ← circular twin-needle (valve setpoint vs actual)
    Knob.tsx  SelectorSwitch.tsx  SpringLoadedSelector.tsx
    ReadoutPanel.tsx  StatusDisplay.tsx  IndicatorLights.tsx
  /styles                       ← plain CSS per concern
  App.tsx                       ← switchboard grid layout
  ExciterChain.tsx              ← AC out, rectified DC, field current gauges
```

---

## Acceptance Criteria (Phase 1 — all met)

- [x] Changing exciter field DC causes the full chain to settle: exciter AC → rectified DC → field current → Vₜ
- [x] Increasing active load with AVR off causes Vₜ to drop
- [x] Increasing active load with AVR on causes exciter field DC to rise automatically, holding Vₜ near reference
- [x] All three exciter chain readouts move when exciter field DC changes
- [x] Leading power factor load causes Q to go negative, labelled "absorbing"
- [x] Load angle (δ) increases with increasing load, warning shown near 90°
- [x] All gauges update smoothly without jank
- [x] Responsive — the 6-column grid scales down at 960 / 820 / 540 px (note: it shrinks, it does not stack)

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