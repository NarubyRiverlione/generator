# Power Factor — Load Power Factor

## What it is

The ratio of active power (P, real work) to apparent power (S, total current × voltage). A power factor of 1.0 means all the current drawn by the load is doing useful work. A power factor below 1.0 means some of the current is circulating to maintain magnetic fields in motors and transformers — it does no work but still heats the wires and stresses the generator.

```
PF = P / S = cos(φ)
```

Where φ is the phase angle between the voltage and current waveforms.

## Lagging vs leading

- **Lagging (inductive):** The current waveform lags behind the voltage — motors, transformers, induction furnaces. The load absorbs reactive power (Q > 0). Most real industrial loads are lagging.
- **Leading (capacitive):** The current leads the voltage — capacitor banks, lightly loaded cables. The load supplies reactive power back to the generator (Q < 0). Less common; can cause over-voltage.

## What determines it on a real machine

The nature of the connected loads. Motors are inherently inductive (lagging). Adding capacitor banks to the busbars shifts PF toward leading. Power factor correction is a common practice in industrial installations to reduce the reactive burden on the generator.

## Realistic range

| Operating condition | Typical PF |
|---|---|
| Heavy industrial load (motors) | 0.7 – 0.85 lag |
| Mixed commercial/industrial | 0.85 – 0.95 lag |
| Capacitor-corrected | 0.95 lag – 1.0 |
| Over-corrected / lightly loaded cable | leading |

## Simulator value

Range **0.6 lag – 1.0 – 0.6 lead**, default **0.85 lag** — typical European industrial load.

## Effect on the machine

- **Lagging load (Q > 0):** Reactive current adds to the stator current, increasing the voltage drop across Xₛ. Vₜ sags more than with a unity PF load. The AVR must supply more field to compensate. The stability margin shrinks faster with rising load.
- **Unity PF:** Cleanest operating point. P_max is at its highest for a given field level.
- **Leading load (Q < 0):** The load returns reactive power to the generator. This can actually *raise* Vₜ above Eₐ (over-excitation of the terminal). The under-excitation limit becomes relevant.

## Related

- [Load fraction](load-fraction.md) — sets P; power factor sets how Q relates to P
- [Xₛ](xs.md) — the reactive voltage drop is proportional to Xₛ; lagging PF makes this worse
- [Voltage stability margin](../concepts/voltage-stability-margin.md) — lagging PF tightens the PV curve significantly
- [Load angle](../concepts/load-angle.md) — PF affects the angle at which the stability limit is reached
