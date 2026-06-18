## Context

Stage 3a added real inertia (swing equation) and manual valve control; the operator feels frequency sag
on load steps and jogs the speed-changer to rebalance `Pm = Pe`. Stage 3b closes the symmetry with the
voltage channel by adding an **automatic isochronous governor** — a PI controller on speed error
`(ωref − ω)` that commands `valvePct` directly, exactly mirroring how the AVR already commands
`fieldVoltage`.

Current AVR pattern (in `simulation.ts`):
- `stepAvr()` in `avr.ts`: PI with anti-windup; clamped to `[AVR_COMMAND_MIN, AVR_COMMAND_MAX]`
- When `inputs.avrOn`, the loop calls `stepAvr` and uses its output as `fieldTarget`; manual path sets
  `fieldTarget = inputs.fieldVoltage` and primes the integrator for bumpless transfer on next engage
- `avrIntegral` is carried in `SimState`; `avrCommand` is surfaced in `Outputs`

Governor will follow the same pattern with `valvePct` as the controlled variable.

## Goals / Non-Goals

**Goals:**
- Add `stepGovernor()` in a new `governor.ts`, structurally mirroring `avr.ts`
- Gate it behind `inputs.governorOn`; default off
- When on: governor drives `valvePct`; `inputs.valveCommand` jogs are ignored; bumpless transfer on engage
- `governorIntegral` in `SimState`; `governorCommand` in `Outputs`
- Constant `OMEGA_REF = 1.0` (50 Hz), governor gains `GOV_KP` / `GOV_KI`, ceiling clamp `[0, 100]`
- Governor-at-ceiling indicator (valve 100 %) mirroring field-at-ceiling indicator in UI
- Speed-changer control read-only when governor is on (shows commanded value)

**Non-Goals:**
- No droop / load-sharing — isochronous only (Phase 4)
- No grid, breaker, or synchronisation logic
- No user-tunable governor gains in this stage (fixed-gain, same as early AVR)
- No changes to swing equation, voltage channel, or existing AVR

## Decisions

### D1 — Mirror avr.ts exactly; new governor.ts file

`stepGovernor(omegaRef, omega, integralIn, kp, ki, dt) → { command, integral }` with the same
anti-windup logic. Clamp output to `[0, 100]` (valve %).

**Why not inline into simulation.ts?** AVR is already split into its own file; consistency is more
valuable than saving a file.

### D2 — governorIntegral in SimState; governorCommand in Outputs

Matches `avrIntegral` / `avrCommand` exactly. No parallel data structures needed.

### D3 — Bumpless transfer: prime integral so governor output equals current valvePct on engage

Same formula used for AVR: `integral = (currentValvePct − kp × error) / ki`. Ensures no valve
kick when the operator flips the switch.

### D4 — When governor on, skip the valveCommand jog step

Currently: `valvePct = clamp(valvePct + jogRate(inputs.valveCommand) × dt)`. When governor is on,
replace this with the governor's commanded value directly. The jog path is simply bypassed.

### D5 — Fixed initial governor gains

`GOV_KP = 10`, `GOV_KI = 2` — chosen to give ~2–4 s recovery on a typical 0.5 pu load step without
sustained oscillation. These mirror the existing `PARAMS.kp = 2, ki = 0.5` philosophy (tunable later
in a dedicated gain-tuning change). Add to `constants.ts` alongside `AVR_VREF`.

### D6 — governorOn added to Inputs; OMEGA_REF to constants.ts

`OMEGA_REF = 1.0` (rated speed, pu). No change to `Params` type in this stage (gains are fixed
constants, not per-simulation parameters).

## Risks / Trade-offs

- **Gain overshoot** → Mitigation: start conservatively (GOV_KP = 10, GOV_KI = 2); a gain-tuning
  follow-on change (mirroring AVR tuning) can expose them later.
- **Valve ceiling during large load step** → governor saturates at 100 %; ceiling indicator communicates
  this to the user; anti-windup prevents integrator wind-up.
- **valveActual lag masking governor authority** → valve actuator lag (TAU_VALVE = 2 s) is already in
  the model; governor integrator will naturally compensate over time. No change needed.

## Migration Plan

No data migration needed — new boolean `governorOn` defaults to `false` in `DEFAULT_INPUTS`. Existing
simulations without the field behave identically to Stage 3a.

## Open Questions

None blocking implementation.
