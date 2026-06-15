# PRD: Synchronous Generator Simulator

## Overview

An interactive single-page React application that simulates the steady-state behaviour of a synchronous generator with an exciter. The goal is educational: to build a deep, intuitive understanding of how a realistic European synchronous generator behaves — the kind you would find in a small-to-medium power plant or industrial installation operating on the 50 Hz European grid.

Parameters are chosen to reflect a real machine, not a textbook toy. Physics are honest but not academically exhaustive.

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
| Synchronous reactance (Xₛ) | 0.8 – 2.0 | 1.2 | pu |
| AVR enable | off / on | off | toggle |
| AVR voltage reference | 380 – 420 | 400 | V (only visible when AVR is on) |

**Rotor speed is fixed at 50 Hz / 1500 RPM equivalent — not user-facing in Phase 1.**

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
│  [AVR Vref]      │── P gauge            │
│                  │── Q / δ / PF        │
└──────────────────┴──────────────────────┘
```

---

## Behaviour Notes

- When AVR is toggled **on**: exciter field DC slider becomes read-only and shows the value AVR is currently commanding. User can still adjust AVR reference voltage.
- When load increases with AVR **off**: terminal voltage drops visibly — this is the key learning moment.
- When load increases with AVR **on**: exciter field DC rises automatically, the entire chain (exciter AC → rectified DC → field current) moves to compensate, Vₜ stays near reference. User can watch the chain react.
- Reactive power (Q) goes **negative** when load is capacitive (leading PF) — label this clearly as "absorbing" vs "supplying".
- Load angle (δ) approaching 90° should show a warning — this is the stability limit.
- Rotor speed and frequency are fixed at 50 Hz / 1500 RPM — no readout needed for MVP.

---

## Out of Scope (MVP)

- Magnetic saturation curve ← **deferred to Phase 2**
- Second field time constant (AVR ringing) ← **deferred to Phase 2**
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

- Add rotor speed / turbine governor slider (47–53 Hz range)
- Show impact of speed deviation on output frequency and voltage
- Key learning: frequency and voltage are independent — turbine controls P/frequency, exciter controls voltage/Q
- This separation is the foundation needed before grid connection
- Magnetic saturation: Eₐ/field curve flattens above ~1.1 pu field; reveals AVR ceiling under heavy load and why over-excitation has diminishing returns
- Second field time constant: stack τ_exciter + τ_field so the step response can overshoot and ring; Kp/Ki tuning in the UI becomes meaningful

### Phase 3 — Synchronisation to grid
**Prerequisite:** Phase 2 complete

- Add a simulated grid reference (fixed 400V, 50Hz)
- Add synchroscope — visual display of phase angle difference between generator and grid
- User must match voltage (exciter), frequency (turbine), and phase angle before closing the breaker
- Closing out of sync triggers a visible disturbance — teaches why synchronisation matters
- Key learning: the procedure and the consequences of getting it wrong

### Phase 4 — Grid-connected operation
**Prerequisite:** Phase 3 complete

- After breaker closes, grid locks frequency and voltage
- Exciter knob now controls **reactive power (Q) flow** to/from grid instead of terminal voltage
- Turbine governor now controls **active power (P) flow** to/from grid instead of frequency
- Key learning: same physical controls, entirely different meaning when grid-connected vs islanded
- Show P and Q flow direction (import/export) as primary readouts

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
- [ ] Changing Xₛ slider with fixed load causes Vₜ and VSM to shift — higher Xₛ produces lower Vₜ and tighter stability margin
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