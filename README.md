# Synchronous Generator Simulator

An interactive single-page simulator for a synchronous generator with an exciter, built for electrical engineering education. Users manipulate physical controls and watch the full signal chain settle in near-real time — from exciter field voltage through the rotor, into the stator, and out to the load.

The goal is to build intuition for relationships that are hard to grasp from equations alone: why terminal voltage sags under load, what the AVR is actually doing, and why frequency and voltage are controlled by entirely separate physical inputs.

Built with Vite + React + TypeScript. All physics in `src/core/` (pure functions, no React). Hand-rolled SVG gauges and a gray-steel switchboard aesthetic.

---

## Project Phases

### Phase 1 — Islanded generator (complete)

Fixed 50 Hz, single machine, no grid connection.

- Exciter field DC knob → exciter AC → rectified DC → field current → terminal voltage
- Active load and power factor sliders with constant-power load model
- AVR with PI controller (Kp = 2.0, Ki = 0.5) and anti-windup
- SVG arc gauges for Vt and P; LCD readout for Q, δ, VSM, PF
- Voltage stability margin (VSM) warning; 27-relay under-voltage trip
- Fixed machine parameters (Xₛ = 1.2 pu, Rₐ = 0.05 pu); AVR reference fixed at rated (1.0 pu / 400 V)

### Phase 2 — RPM / Frequency control (planned)

Prerequisite: Phase 1.

- Turbine governor **speed-changer** — spring-return raise/lower switch (two-stage slow/fast) driving
  the **fine** governor valve within the 47–53 Hz band; machine starts already running at 1500 rpm
- Rotor speed scales internal EMF: `Eₐ = field × speed_pu`, so a speed change moves both frequency and voltage
- **RPM** (headline) and **Hz** readouts, plus a fine-valve-position readout; kinematic spin-up lag (τ ≈ 2.5 s)
- Key learning: turbine controls frequency/P, exciter controls voltage/Q — independent channels

### Saturation & AVR tuning (planned — standalone, unscheduled)

Carved out of Phase 2 (it concerns the voltage channel). Prerequisite: Phase 2.

- Magnetic saturation: Ea/field curve flattens above ~1.1 pu; shows AVR ceiling under heavy load
- Second field time constant: stacked τ_exciter + τ_field produces AVR overshoot and ringing
- Kp/Ki become user-adjustable; tuning against the second-order saturating plant becomes meaningful

### Phase 3 — Synchronisation to grid (planned)

Prerequisite: Phase 2.

- **Coarse throttle valve and run-up from rest** (0 → 1500 rpm) — the startup Phase 2 assumes done; true rotor inertia (swing equation)
- Simulated grid reference (fixed 400 V, 50 Hz)
- Synchroscope showing phase angle difference between generator and grid
- User must match voltage, frequency, and phase before closing the breaker
- Closing out of sync triggers a visible disturbance

### Phase 4 — Grid-connected operation (planned)

Prerequisite: Phase 3.

- Grid locks frequency and voltage after breaker closes
- Exciter knob now commands reactive power (Q) flow to/from grid
- Turbine governor now commands active power (P) flow to/from grid
- Key learning: same physical controls, entirely different meaning when islanded vs. grid-connected
- ZIP load model (constant-impedance + constant-current + constant-power mix): reveals self-regulating load behaviour vs. the worst-case constant-power model used in Phases 1–3
- PV nose-point curve with proper stability margin in MW distance to collapse
