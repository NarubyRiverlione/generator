## Why

Phase 1 fixes rotor speed at 50 Hz, which obscures the key teaching point that frequency and voltage
are *independently* controlled — the turbine governor sets speed/frequency, and the exciter sets
voltage/Q. Phase 2 unlocks rotor speed so learners can directly observe that separation before Phase 3
introduces grid synchronisation (which requires it as a prerequisite).

The control is modelled the way an operator actually experiences it: you do not dial in a frequency,
you command the **turbine intake valve** with a raise/lower switch, and the shaft speed — read out as
**RPM** (and Hz) — follows after the valve travels and the shaft spins up.

## What Changes

- Add a **turbine governor speed-changer** driving the intake valve: a spring-return raise/lower switch
  (two-stage: slow/fast). The valve-position state is persistent — it holds when the switch springs back
  to neutral. Phase 2 starts with the valve already at ~93 % (giving ~1495 rpm — slightly
  sub-synchronous); the operator uses the speed-changer to trim from there.
- Track **valve position** (0–100 %) as persistent state. 0 % = fully closed = 0 rpm. Map linearly to
  a target RPM: 0 % → 0 rpm, 100 % → 1600 rpm (overspeed trip point). Rated speed (1500 rpm) occurs
  at ~93.75 % valve. Shaft speed follows the valve-implied target through a **spin-up lag** (τ = 2.5 s).
- **Direction of causality:** valve % → RPM target → (spin-up lag) → RPM → Hz. Hz is a derived
  display readout; the shaft only knows RPM.
- Make internal EMF Eₐ proportional to rotor speed (`Eₐ = field_pu × speed_pu`, where
  `speed_pu = rpm / 1500`), so a speed change sags or lifts both voltage and frequency.
- Add **RPM** (headline) and **Hz** readouts, plus a **valve-position** readout. 4-pole machine:
  Hz = rpm / 30, so 1500 rpm = 50 Hz.
- Remove the Phase 1 "rotor speed is fixed" restriction from the input panel.

Magnetic saturation, the second field time constant, and adjustable Kp/Ki — originally drafted here —
are **carved out** into the separate `avr-tuning-and-saturation` change, as they concern the voltage
channel, not rotor speed.

Deferred to **Phase 3** (startup + grid sync): shaft run-up from rest (valve 0 % → operating position),
true rotor inertia (swing equation), and the startup sequence. Phase 2 starts with the valve already
at the operating position; the operator trims from there.

## Capabilities

### New Capabilities
- `turbine-governor`: the speed-changer raise/lower switch, the valve-position state, the kinematic
  valve→RPM map, the spin-up lag, and the RPM/Hz readouts displayed alongside terminal voltage.

### Modified Capabilities
- `simulation-core`: speed is no longer fixed at 1.0 pu; the solver SHALL accept pu speed as an input
  and scale Eₐ by it before solving the circuit; RPM is derived as `(valvePct / 100) × 1600`,
  speed_pu as `rpm / 1500`, and frequencyHz as `rpm / 30`.
- `simulator-ui`: the input panel SHALL expose the governor speed-changer switch and a valve-position
  readout; the "no rotor-speed control" requirement is replaced; RPM and Hz readouts SHALL appear in
  the generator output section.

## Impact

- `src/core/types.ts` — `Inputs` gains a valve-rate command (raise/lower switch position);
  `SimState` gains `valvePct` and `speedLagged`; `Outputs` gains `frequencyHz`, `rpm`, `valvePct`.
- `src/core/constants.ts` — add `VALVE_RPM_MAX = 1600`, jog rates, `TAU_SPINUP = 2.5`, pole count (4).
- `src/core/simulation.ts` — integrate `valvePct` from the switch, map to RPM target, advance the
  spin-up lag, derive `speed_pu`, scale `Eₐ` by `speed_pu`, derive `frequencyHz` and `rpm`.
- `useGeneratorSimulation` hook — hold the switch position, pass it into the core step.
- `App.tsx` — add the spring-return speed-changer dial; add valve/RPM/Hz readouts.
- No new dependencies.
