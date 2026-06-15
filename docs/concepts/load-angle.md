# Load Angle (δ)

## What it is

The angle between the rotor's magnetic field and the stator's resultant magnetic field. At no load they are perfectly aligned — the rotor drags the stator field along with zero lag. As you add load, the rotor field has to pull harder, and the stator field starts to lag behind. The angle between them is δ.

It is sometimes called the *torque angle* because it is directly related to the mechanical torque the turbine must apply.

## The physical picture

Imagine two magnets rotating together. At no load the north pole of one is right next to the north pole of the other — they are locked in step. When you apply a load (try to slow the stator side down), the rotor magnet gets ahead of the stator magnet. The angle between them is δ. The bigger the load, the bigger the angle.

At δ = 90° the magnetic pull between rotor and stator is at its maximum. Beyond 90° it weakens — the rotor slips and the machine loses synchronism. This is the fundamental stability limit of a synchronous machine.

## The formula

```
P = 3 · Vₜ · Eₐ / Xₛ · sin(δ)
```

Active power is proportional to sin(δ). Since sin peaks at 90°, P_max occurs at δ = 90°.

## Important nuance — real collapse happens before 90°

With a lagging power factor load, the machine collapses at a much smaller angle than 90°. At PF 0.85 lag with Xₛ = 1.2, the nose point is reached at δ ≈ 26–29°. The classical "danger at 90°" only applies at unity power factor.

This is why the simulator uses the [voltage stability margin](voltage-stability-margin.md) (discriminant-based) rather than a δ threshold — a δ-based warning fires too late for lagging loads.

## What to observe in the simulator

The δ readout (in degrees) increases as you raise load. Watch how the rate of increase changes with power factor — a lagging load drives δ up faster for the same increase in load fraction, leaving less headroom before the VSM warning fires.

## Simulator display

Shown in degrees on the LCD readout. No separate warning threshold — the VSM indicator captures the stability risk more accurately.

## Related

- [Load fraction](../parameters/load-fraction.md) — the primary driver of δ
- [Xₛ](../parameters/xs.md) — higher Xₛ means more δ per unit of load
- [Voltage stability margin](voltage-stability-margin.md) — the physics-correct stability indicator that replaces a δ threshold
- [Power factor](../parameters/power-factor.md) — determines how quickly δ grows with load
