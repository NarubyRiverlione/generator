## Why

Without damper windings the swing equation is a pure integrator: every load disturbance produces a
speed deviation that grows linearly with load size and persists until the governor corrects it.
This makes small load steps look like large frequency events and causes the ~linear X%-load →
X%-rpm-drop behaviour observed in Phase 3b.

Real synchronous machines have **amortisseur (damper) windings** — short-circuited copper bars in
the rotor pole faces (salient pole) or the solid steel rotor body (turbogenerator). They carry zero
current at synchronous speed and produce a braking torque proportional to speed deviation the
instant slip occurs. Small disturbances barely register; larger ones are arrested faster and with
less overshoot.

Without this, synchronisation to a live grid (Phase 3d) is impractical: any minor disturbance
would produce a multi-Hz frequency excursion that would immediately pull the machine out of step.

## What Changes

Add a damping coefficient `D` to the swing equation:

```
dω/dt = (Pm − Pe − D·(ω − ωref)) / (2H)
```

`D` is small (suggested starting value: **0.05–0.1 pu** on machine base — typical for a
medium-speed salient-pole machine). At steady state `D·(ω − ωref) = 0` so it has no effect on
the isochronous governor's ability to hold exactly 1500 rpm. Under a disturbance it provides
immediate viscous drag proportional to slip.

The damping term belongs in the swing equation in `simulation.ts`. `D` should be a named constant
in `constants.ts` (`DAMPING_D`).

## Educational value

This is an important teaching point: the damper winding is a *passive* stabiliser built into the
rotor — it requires no control logic, no sensors, no feedback. It works purely by electromagnetic
induction. Adding it to the simulator lets the learner see:

- Small load steps absorbed with almost no visible rpm change
- The contrast with the undamped behaviour (can be demonstrated by setting D = 0)
- Why synchronisation is possible at all on real grids

## Prerequisite for

Phase 3d (grid synchronisation) — without this, any sync attempt will be immediately broken by
the undamped frequency response to grid disturbances.

## Phase ordering

```
Phase 3a  swing equation (done)
Phase 3b  automatic governor (done)
Phase 3c  damper windings          ← this change
Phase 3d  grid synchronisation
```
