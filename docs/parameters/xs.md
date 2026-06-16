# Xₛ — Synchronous Reactance

## What it is

The magnetic pushback that the stator winding current exerts against the rotor's ability to drive terminal voltage. When load current flows through the stator coils, those coils are inductors — they build up their own magnetic field that opposes the rotor field. That opposition, expressed as an impedance at 50 Hz, is Xₛ.

It is called *synchronous* reactance because it is measured at the machine's operating frequency. At DC it would be zero.

## What determines it on a real machine

Fixed by construction — it is stamped on the nameplate and cannot be adjusted from the control room:

- number of stator winding turns
- geometry of the iron core and air gap
- permeability of the stator steel

A physically larger machine with fewer turns per phase and a wide air gap has lower Xₛ (stiffer). A machine designed for high voltage with many winding turns has higher Xₛ (softer).

## Realistic range

| Machine type | Typical Xₛ |
|---|---|
| Large turbo-generator (steam/gas) | 0.8 – 1.3 pu |
| Salient-pole hydro generator | 0.9 – 1.5 pu |
| Small industrial generator | 1.0 – 2.0 pu |

## Simulator value

**1.2 pu** — mid-range for a round-rotor turbo-generator. Realistic for a small European power plant or industrial CHP unit.

## Effect on the machine

Xₛ appears directly in the core voltage equation:

```
Eₐ = Vₜ + Iₐ · jXₛ
```

**Voltage regulation:** Higher Xₛ → larger voltage drop across the stator for the same load current → Vₜ sags more under load → AVR has to work harder to compensate.

**Maximum power:** The power ceiling is:

```
P_max = 3 · Eₐ · Vₜ / Xₛ
```

Double Xₛ → halve P_max. A soft machine hits its stability limit at a much lower load than a stiff one.

**Voltage stability margin:** Higher Xₛ shrinks the VSM at any given operating point. The machine is closer to the nose of the PV curve.

## What to observe in the simulator

Xₛ is fixed in Phase 1 — it is a machine property, not a control. Understanding it here sets the foundation for the Saturation & AVR-tuning change, where saturation will show that Xₛ is not perfectly constant across operating points.

## Related

- [Load angle](../concepts/load-angle.md) — Xₛ appears in the sinδ formula; higher Xₛ means the same P requires a larger angle
- [Voltage stability margin](../concepts/voltage-stability-margin.md) — Xₛ is the dominant factor in how tight the PV curve is
- [AVR](../concepts/avr.md) — a higher Xₛ machine demands more AVR authority to hold Vₜ under load
- [τ (field time constant)](tau.md) — independent of Xₛ but both shape how quickly Vₜ responds to a field change
