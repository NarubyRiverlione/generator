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

| Stage | Name | Status |
|---|---|---|
| Phase 1 | Islanded generator — exciter, AVR, voltage | done |
| Phase 2 | RPM / frequency control — valve, governor speed-changer | done |
| Saturation & AVR tuning | Magnetic saturation, second field lag, adjustable Kp/Ki | done |
| 3a | Rotor swing dynamics — swing equation, inertia | done |
| 3b | Automatic governor — PI frequency regulation | done |
| 3c | Damper windings — passive rotor stabilisation | done |
| 3d | Cold-start load pickup — load breaker, instantaneous step | planned |
| 3e | Load shedding — ANSI-81 under-frequency relay | planned |
| 4a | Second generator startup | planned |
| 4b | Synchronisation between units — synchroscope, ANSI-25 | planned |
| 4c | Droop and load sharing — parallel governors | planned |
| 4d | Consumer-triggered standby start | planned |
