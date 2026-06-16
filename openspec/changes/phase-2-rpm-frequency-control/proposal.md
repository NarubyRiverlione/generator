## Why

Phase 1 fixes rotor speed at 50 Hz, which obscures the key teaching point that frequency and voltage
are *independently* controlled — the turbine governor sets speed/frequency, and the exciter sets
voltage/Q. Phase 2 unlocks rotor speed so learners can directly observe that separation before Phase 3
introduces grid synchronisation (which requires it as a prerequisite).

The control is modelled the way an operator actually experiences it: you do not dial in a frequency,
you command the **turbine intake valve** with a raise/lower switch, and the shaft speed — read out as
**RPM** (and Hz) — follows after the valve travels and the shaft spins up.

## What Changes

- Add a **turbine governor speed-changer** driving the **fine** intake valve: a spring-return
  raise/lower switch (two-stage: slow/fast). This is the fine-trim valve only — the coarse throttle
  valve and run-up from rest are deferred to Phase 3 (see below). The machine starts already running at
  1500 rpm (coarse valve at run speed).
- Track **fine-valve position** (0–100 %) as a persistent state that holds when the switch is released.
  0 % is the *low end of the governable band*, not a closed valve — base speed is held by the coarse
  valve (Phase 3 / assumed at run speed in Phase 2).
- Map fine-valve position to a **target rotor speed** (kinematic, linear over the narrow band):
  0 % → 1410 rpm (47 Hz), 50 % → 1500 rpm (50 Hz), 100 % → 1590 rpm (53 Hz). Shaft speed follows the
  valve-implied target through a **spin-up lag** (τ = 2.5 s), so speed trails the valve.
- Make internal EMF Eₐ proportional to rotor speed (`Eₐ = field_pu × speed_pu`), so a speed change sags
  or lifts both voltage and frequency, matching real machine physics.
- Add **RPM** (headline) and **Hz** readouts, plus a **valve-position** readout. 4-pole machine:
  RPM = 30 × Hz, so 1500 rpm = 50 Hz.
- Remove the Phase 1 "rotor speed is fixed" restriction from the input panel.

Magnetic saturation, the second field time constant, and adjustable Kp/Ki — originally drafted here —
are **carved out** into the separate `avr-tuning-and-saturation` change, as they concern the voltage
channel, not rotor speed.

Deferred to **Phase 3** (startup + grid sync): the **coarse throttle valve**, run-up of the shaft from
rest (0 → 1500 rpm), and the absolute intake-valve characteristic. Phase 2 exercises only the fine
governing band around an already-running machine.

## Capabilities

### New Capabilities
- `turbine-governor`: the speed-changer raise/lower switch, the valve-position state, the kinematic
  valve→speed map, the spin-up lag, and the RPM/Hz readouts displayed alongside terminal voltage.

### Modified Capabilities
- `simulation-core`: speed is no longer fixed at 1.0 pu; the solver SHALL accept pu speed as an input
  and scale Eₐ by it before solving the circuit; output frequency is derived as `f = 50 × speed_pu` and
  RPM as `30 × f`.
- `simulator-ui`: the input panel SHALL expose the governor speed-changer switch and a valve-position
  readout; the "no rotor-speed control" requirement is replaced; RPM and Hz readouts SHALL appear in
  the generator output section.

## Impact

- `src/core/types.ts` — `Inputs` gains a valve-rate command (raise/lower switch position);
  `SimState` gains `valvePct` and `speedLagged`; `Outputs` gains `frequencyHz`, `rpm`, `valvePct`.
- `src/core/constants.ts` — add valve→speed band, jog rates, `TAU_SPINUP = 2.5`, pole count (4).
- `src/core/simulation.ts` — integrate `valvePct` from the switch, map to target speed, advance the
  spin-up lag, scale `Eₐ` by `speed_pu`, derive `frequencyHz` and `rpm`.
- `useGeneratorSimulation` hook — hold the switch position, pass it into the core step.
- `App.tsx` — add the raise/lower switch (styled like the AVR selector); add valve/RPM/Hz readouts.
- No new dependencies.
