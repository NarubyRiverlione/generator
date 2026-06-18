## Why

The damper winding effect is a passive, instantaneous electromagnetic brake — zero at synchronous
speed, non-zero only during a transient. Showing the live damping torque (`D · (ω − ωref)`) on the
LCD during a load step makes that behaviour legible: the learner sees a value spike and immediately
return to zero, illustrating that the damper acts without any control logic.

## What Changes

- Expose `dampingTorque = DAMPING_D * (omega - OMEGA_REF)` as a field on `Outputs` in `simulation.ts`
- Add an LCD tile for it in the Phase 3d gauge layout (where sync signals are already being added)

## Deferred Until

Phase 3d — the LCD layout is being revised for synchronisation signals anyway; this fits naturally
into that pass rather than touching the UI twice.

## Educational Value

Shows the learner:
- The damper winding produces zero torque at steady state
- The braking torque is proportional to slip — visible as a spike on a load step
- Contrast with AVR/governor: those are active control loops; this is passive physics
