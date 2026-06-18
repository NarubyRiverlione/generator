# Damper Windings (Amortisseur Windings)

## What they are

Damper windings are short-circuited conductors built into the rotor of a synchronous machine.

- **Salient-pole machines** (hydro, slow-speed): copper bars embedded in slots cut into each pole
  face, connected at both ends by end rings — structurally similar to a squirrel-cage induction
  motor rotor, sitting directly alongside the main DC field coil.
- **Round-rotor turbogenerators** (steam, gas, high-speed): the solid forged-steel rotor body
  itself acts as a distributed damper — eddy currents flow in the rotor iron during slip.

## How they work

At exactly synchronous speed the rotor field and the air-gap flux rotate together — no relative
motion, no induced current, no torque. The damper windings are invisible to the machine at steady
state.

The moment rotor speed deviates from synchronous — say a load step decelerates it slightly — the
rotating flux *slips* relative to the bars. By Lenz's law, currents induced in the bars oppose
the change, producing a torque that resists the slip. The faster the deviation, the stronger the
braking force. This is **viscous damping**: torque proportional to `Δω = ω − ωref`.

In the swing equation this appears as the `D` term:

```
2H · dω/dt = Pm − Pe − D·(ω − ωref)
```

`D` is typically **0.05–0.15 pu** on the machine rating for a medium-speed machine.

## What they do for the operator

| Without dampers | With dampers |
|---|---|
| Any load step → rpm deviation grows until governor corrects | Small disturbances absorbed almost instantly, barely visible on the rpm gauge |
| Load-step drop ≈ proportional to load size | Drop much smaller; larger steps still droop but less severely |
| Rotor hunts (oscillates) after a disturbance | Oscillations die out in 1–2 cycles |
| Grid synchronisation impractical | Grid synchronisation feasible — disturbances don't break sync |

## Why it matters for synchronisation

When connecting to a live grid, the machine must maintain synchronism through every load
fluctuation on the grid. Without damping, even a 1 % grid disturbance produces a visible frequency
excursion. With dampers the machine "sticks" to synchronous speed passively, and the governor only
needs to handle the slower, larger power-balance corrections.

## Simulator status

The damping term (`D·(ω − ωref)`) is **not yet implemented** — tracked in
`openspec/changes/phase-3c-damper-windings/`. Until it is, the simulator shows the undamped
behaviour: load-step rpm drop is approximately proportional to load size, and there is no
oscillation decay. This is Phase 3c work, prerequisite for Phase 3d grid synchronisation.
