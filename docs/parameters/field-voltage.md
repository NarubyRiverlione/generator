# Field Voltage — Exciter DC Setpoint

## What it is

The DC voltage applied to the exciter, which drives the current through the rotor field winding. More field voltage → stronger rotor magnetic field → higher internal EMF Eₐ → higher terminal voltage Vₜ (all else equal).

This is the primary voltage control input on a real generator. On an islanded machine the operator adjusts it directly or delegates it to the AVR.

## The signal chain

```
Field voltage (DC) → Exciter AC → Rectified DC → Field current → Eₐ → Vₜ
```

Each arrow in this chain has a gain (fixed ratio) and the whole chain has inertia governed by [τ](tau.md). The simulator shows each stage of this chain explicitly so you can watch the signal propagate.

## What determines it on a real machine

Set by the operator (manual mode) or the AVR (automatic mode). The physical limits are the exciter's ceiling voltage — the maximum DC it can produce before saturation or thermal limits apply.

## Realistic range

| Operating point | Typical field voltage |
|---|---|
| No load, rated Vₜ | ~0.8 – 1.0 pu |
| Full load, lagging PF, AVR holding Vₜ | ~1.1 – 1.4 pu |
| AVR ceiling (maximum excitation) | ~1.5 pu |
| Minimum (under-excitation limit) | ~0.5 pu |

## Simulator value

Range **0.0 – 1.5 pu**, default **0.0 pu** (machine starts de-energised). When AVR is on, this input becomes read-only and the AVR commands it automatically.

## Effect on the machine

- Raising field voltage raises Eₐ, which raises Vₜ and increases the reactive power Q the machine supplies to the load.
- Lowering field voltage below the level needed to support the load causes Vₜ to sag. Below a threshold the 27 relay trips.
- With AVR off, field voltage is the only handle on terminal voltage.

## Related

- [τ (field time constant)](tau.md) — governs how fast the field current responds to a change in field voltage setpoint
- [Vref](vref.md) — the AVR reference voltage that the AVR uses to command field voltage automatically
- [AVR](../concepts/avr.md) — takes over field voltage control when enabled
- [Relay 27](../concepts/relay-27.md) — trips if field voltage is too low to sustain Vₜ under load
