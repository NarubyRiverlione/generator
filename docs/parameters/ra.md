# Rₐ — Stator (Armature) Resistance

## What it is

The ohmic resistance of the stator windings — the real, heat-producing resistance of the copper wire. Unlike [Xₛ](xs.md), which is reactive (magnetic pushback), Rₐ is resistive: it dissipates energy as heat and causes a voltage drop that is in phase with the current.

## What determines it on a real machine

The length, cross-section, and material of the stator conductors. In large machines the conductors are thick and short relative to the machine size, so Rₐ is very small. In small machines it is proportionally larger.

## Realistic range

| Machine size | Typical Rₐ |
|---|---|
| Large turbo-generator (100+ MVA) | 0.002 – 0.01 pu |
| Medium industrial generator (1–10 MVA) | 0.01 – 0.05 pu |
| Small generator (< 1 MVA) | 0.05 – 0.1 pu |

## Simulator value

**0.05 pu** — consistent with a small machine at 1 MVA. At this value Rₐ/Xₛ ≈ 4%, so its effect on the power equation is roughly (Rₐ/Xₛ)² ≈ 0.2% — negligible.

## Effect on the machine

Rₐ appears in the full voltage equation:

```
Eₐ = Vₜ + Iₐ · (Rₐ + jXₛ)
```

In practice, Rₐ is so much smaller than Xₛ that it has no meaningful impact on steady-state voltage, power, or stability. Its main real-world relevance is thermal — it determines copper losses and generator efficiency, which are outside the scope of this simulator.

In the simulator, Rₐ is used only to compute armature current Iₐ magnitude in the phasor derivation. It is excluded from the power equation quadratic (the simplification costs 0.2% accuracy).

## What to observe in the simulator

Nothing — Rₐ is fixed and its effect is below the resolution of the gauges. It is documented here for completeness and to explain why it can be safely ignored in steady-state analysis.

## Related

- [Xₛ](xs.md) — the dominant stator impedance; Rₐ is negligible in comparison
