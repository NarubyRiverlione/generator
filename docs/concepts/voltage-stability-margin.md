# Voltage Stability Margin (VSM)

## What it is

A measure of how far the operating point is from voltage collapse — the point where no amount of field current can hold the terminal voltage and the machine's output buckles.

VSM = 1.0 means the machine is at no load, fully stable. VSM = 0.0 means the machine is exactly at the nose point of the PV curve, one small step from collapse.

## The PV curve

A generator's terminal voltage (V) plotted against delivered power (P) traces a curve that bends backward at high load — the "nose" of the PV curve. The upper half of the curve is the stable operating region. The nose point is the absolute limit of what the machine can deliver.

```
Vₜ
 │
 │  ╲
 │   ╲
 │    ╲  ← stable region (upper branch)
 │     ╲
 │      ○  ← nose point (VSM = 0)
 │      /
 │     /   ← unstable region (lower branch, not physically reachable)
 └──────────── P
```

## How the simulator computes it

The machine equations reduce to a quadratic in Vₜ²:

```
A·u² + B·u + C = 0,   u = Vₜ²
```

The discriminant `D = B² − 4AC` is positive in the stable region and goes to zero exactly at the nose point. The simulator uses:

```
VSM = max(0, D) / D_no_load
```

Where `D_no_load` is the discriminant at zero load (maximum possible D for the current field). This normalises VSM to [0, 1] independent of operating point, power factor, or field level.

## Why not use load angle δ as the indicator?

The classical stability limit (δ = 90°) only applies at unity power factor. With a lagging load the nose point is reached at δ ≈ 26–29° (at PF 0.85 lag, Xₛ = 1.2). A δ-based warning at 70° or 85° would never fire before collapse. The discriminant-based VSM is correct across all power factors.

## Simulator display

Shown as a percentage on the LCD. Colour coding:
- Green: VSM > 20%
- Amber: VSM 8–20% (getting tight)
- Red: VSM < 8% (near collapse, 27 relay likely to trip soon)

## Related

- [Load fraction](../parameters/load-fraction.md) — the main driver of VSM reduction
- [Power factor](../parameters/power-factor.md) — lagging PF tightens the PV curve significantly
- [Xₛ](../parameters/xs.md) — higher Xₛ means a tighter PV curve and lower VSM at the same load
- [Load angle](load-angle.md) — related concept; VSM is the better stability indicator
- [Relay 27](relay-27.md) — trips at Vₜ < 0.85 pu, which typically occurs before VSM reaches zero
