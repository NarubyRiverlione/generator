# Synchronous Generator Simulator

An interactive single-page simulator for a synchronous generator with an exciter, built for electrical engineering education. Users manipulate physical controls and watch the full signal chain settle in near-real time — from exciter field voltage through the rotor, into the stator, and out to the load.

The goal is to build intuition for relationships that are hard to grasp from equations alone: why terminal voltage sags under load, what the AVR is actually doing, and why frequency and voltage are controlled by entirely separate physical inputs.

## Machine context

The simulated vessel is a **harbour tug** with **two identical 1 MVA generators** on an isolated internal grid. There is no shore connection, no infinite bus. The generators *are* the grid.

The simulator teaches through two distinct scenarios:
- **Manual unit, auto reference** — Generator 2 runs automatically, owns the frequency. The learner operates Generator 1 and syncs to it.
- **Auto unit, manual reference** — Generator 1 is the running reference. Generator 2 starts automatically; the learner watches or assists the sync and parallel operation.

Realistic operating range is **40–70 % per unit** — the machines are intentionally oversized so bow thruster starts and towing peaks stay within headroom.

> **Branch point — utility grid variant:** the codebase at git tag `islanded-baseline` is the clean
> starting point for a future utility-scale simulator (infinite bus, power station unit, grid operator
> context). That variant follows a different operational philosophy and should branch from that tag.

Built with Vite + React + TypeScript. All physics in `src/core/` (pure functions, no React). Hand-rolled SVG instruments and a gray-steel switchboard aesthetic. Uses **pnpm** as the package manager (`pnpm install`, `pnpm dev`, `pnpm vitest run --coverage`).

See [`docs/naming.md`](docs/naming.md) for the canonical component names (`Gauge`, `PositionIndicator`, `Knob`, `SelectorSwitch`, `SpringLoadedSelector`) — these names must be used consistently in all new development, specs, and docs.

---

## Project Phases

### Phase 1 — Islanded generator (complete)

Fixed 50 Hz, single machine, no grid connection.

- Exciter field DC knob → exciter AC → rectified DC → field current → terminal voltage
- Active load and power factor sliders with constant-power load model
- AVR with PI controller (Kp = 2.0, Ki = 0.5) and anti-windup
- SVG arc gauges for Vt and P; LCD readout for Q, δ, VSM, PF
- Voltage stability margin (VSM) warning; 27-relay under-voltage trip
- Fixed machine parameters (Xₛ = 0.8 pu, Rₐ = 0.05 pu); AVR reference fixed at rated (1.0 pu / 400 V)

### Phase 2 — RPM / Frequency control (complete)

Prerequisite: Phase 1.

- Turbine governor **speed-changer** — spring-return raise/lower switch (two-stage slow/fast) driving
  the intake valve (0–100 %, where 0 % = closed = 0 rpm, 100 % = 1600 rpm overspeed); sim starts at
  ~93.1 % valve / ~1495 rpm (slightly sub-synchronous — valve almost fully open, as in a real plant)
- Rotor speed scales internal EMF: `Eₐ = field × speed_pu`, so a speed change moves both frequency and voltage
- **RPM** (headline) and **Hz** readouts (Hz derived from RPM); valve-position readout; kinematic spin-up lag (τ ≈ 2.5 s)
- Key learning: turbine controls frequency/P, exciter controls voltage/Q — independent channels

> **Planned addition (branch `spec-twin-needle-valve-dial`):** a `PositionIndicator` (twin-needle circular instrument) as the
> primary readout for intake valve position — spec exists on that branch, not yet merged.

### Saturation & AVR tuning (complete)

Carved out of Phase 2 (it concerns the voltage channel). Prerequisite: Phase 2.

- Magnetic saturation: Ea/field curve flattens above the knee; shows AVR ceiling under heavy load.
  Surfaced live on the LCD as a saturation-derate (`SAT %`) readout
- Second field time constant: stacked τ_exciter (0.4 s) + τ_field (1.1 s) produce AVR overshoot and ringing
- Kp/Ki are user-adjustable; tuning against the second-order saturating plant is meaningful

### Phase 3 — Dynamic islanded operation (in progress)

Prerequisite: Phase 2.

- **3a** ✓ Rotor swing dynamics — swing equation, run-up from rest, inertia constant H
- **3b** ✓ Automatic governor — PI frequency regulation, isochronous, anti-windup
- **3c** ✓ Damper windings — `D·(ω − ωref)` passive rotor stabilisation
- **3d** Cold-start load pickup — load breaker button, instantaneous step, survive or stall
- **3e** Load shedding — ANSI-81 under-frequency relay, priority load shed sequence

### Phase 4 — Ship's parallel operation (planned)

Prerequisite: Phase 3.

- **4a** Second generator startup alongside the running unit
- **4b** Synchronisation to the ship's internal grid — synchroscope, ANSI-25 synchro-check, breaker close; damper winding effect becomes dramatic
- **4c** Droop and load sharing — parallel governors, proportional load split
- **4d** Consumer-triggered standby start — bow thruster / crane triggers automatic startup, sync, and close
