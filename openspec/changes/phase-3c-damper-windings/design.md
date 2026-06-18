## Context

The swing equation in `src/core/simulation.ts` (line 186) currently reads:

```ts
const omegaRaw = state.omega + ((Pm - Pe) / (2 * INERTIA_H)) * dt
```

This is a pure integrator: any power imbalance produces an unbounded speed ramp until the governor restores balance. Small disturbances produce the same proportional rpm excursion as large ones — the machine has no inherent resistance to slip.

Real synchronous machines resist slip passively through amortisseur (damper) windings — shorted conductors in the rotor that carry zero current at synchronous speed but produce a braking torque proportional to slip the instant the rotor deviates. There is no sensor, no feedback, no control loop.

`INERTIA_H = 4` is already defined in `src/core/constants.ts`. `OMEGA_REF` (1.0 pu, 1500 rpm) is used by the governor and can serve as the reference for the damping term.

## Goals / Non-Goals

**Goals:**
- Add a damping coefficient `DAMPING_D` to the swing equation so small load steps produce minimal rpm deviation
- Make damper behaviour visible: setting `D = 0` restores the undamped response for contrast
- Keep the governor isochronous: `D·(ω − ωref) = 0` at steady state so the governor can still hold exactly 1500 rpm

**Non-Goals:**
- Sub-transient saliency or q-axis damper physics (this is a simplified `D·Δω` viscous-drag model)
- UI toggle for enabling/disabling damper windings (D = 0 comparison is a dev/test concern)
- Changes to AVR, governor, or saturation models

## Decisions

### 1. Placement: swing equation only

The damping term belongs only in the swing equation integration step. It is not an electrical quantity and does not affect the machine model (flux, voltage, current).

**Why not governor path?** The governor already handles steady-state droop recovery. The damping term acts before the governor has time to respond — it is instantaneous electromagnetic drag, not a control action.

### 2. Formulation: `D · (ω − ωref)` subtracted from net torque

```
dω/dt = (Pm − Pe − D·(ω − ωref)) / (2H)
```

Equivalent implementation in TS:

```ts
const dampingTorque = DAMPING_D * (state.omega - OMEGA_REF)
const omegaRaw = state.omega + ((Pm - Pe - dampingTorque) / (2 * INERTIA_H)) * dt
```

**Why `ω − ωref` not just `ω`?** Using slip (deviation from synchronous speed) means the term is zero at rated speed and only acts when there is a disturbance. Using bare ω would produce a permanent braking force at rated speed that the governor would have to fight continuously.

### 3. Initial value: `DAMPING_D = 0.05`

Typical range for a medium-speed salient-pole machine is 0.05–0.10 pu. Starting at the lower end keeps the damping clearly visible but not overdamped — a small load step should show a brief, small excursion rather than dead-beat suppression.

**Alternatives considered:** 0.10 pu would be more aggressively damped; 0.02 pu would be barely perceptible at small steps. 0.05 is the pedagogically clearest starting point.

### 4. Constant location: `src/core/constants.ts`

Follows the existing pattern (`INERTIA_H`, `GOV_KP`, `GOV_KI`). Named `DAMPING_D` for clarity — `D` is the standard symbol in power systems literature.

## Risks / Trade-offs

- **Too small a D feels indistinguishable from undamped** → Starting at 0.05 should be visible on a 10–20 % load step. Can be tuned upward if needed.
- **Interaction with governor integral** → Governor already integrates speed error; damping reduces the speed error magnitude, which reduces the governor's corrective action. This is correct behaviour: the governor does less work because the damper absorbs some of the disturbance. No interaction risk.
- **Simulation timestep sensitivity** → The damping term is first-order in `dt` like the existing swing equation. No new numerical stability concern at the current step size.

## Open Questions

None — this is a well-defined, minimal change.
