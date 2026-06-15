# Load Fraction — Active Load

## What it is

The active power demand placed on the generator, expressed as a fraction of rated output (0–100%). It represents the sum of all resistive and motor loads connected to the generator's busbars.

Active power is the real, work-doing power — what spins motors, heats resistors, and lights lamps. It is measured in watts (W) or kilowatts (kW).

## What determines it on a real machine

The connected loads. On an islanded generator the operator has no direct control over what loads are connected — the load fraction reflects what equipment is switched on. The generator must supply whatever is demanded (up to its limits) or the voltage collapses.

On a grid-connected machine (Phase 4) the turbine governor determines how much of the total grid load this machine picks up. Islanded is the harder case.

## Simulator value

Range **0 – 100%** of rated (1 MVA), default **0%**. The load model is constant-power: P and Q are set by the sliders and do not vary with Vₜ. This is the worst-case model — real loads are partly voltage-dependent and self-regulating.

## Effect on the machine

- Raising load increases Iₐ, which increases the voltage drop across Xₛ, which sags Vₜ.
- The AVR responds by raising field voltage to push Eₐ up and restore Vₜ.
- Beyond a threshold (the PV nose point), no amount of field can hold Vₜ — the machine collapses.
- The 27 relay trips before collapse is reached.

## Related

- [Power factor](power-factor.md) — determines how load fraction splits between P and Q
- [Xₛ](xs.md) — determines how much Vₜ sags per unit of load current
- [Voltage stability margin](../concepts/voltage-stability-margin.md) — shrinks as load fraction rises
- [Relay 27](../concepts/relay-27.md) — trips when load drives Vₜ below 0.85 pu
- [AVR](../concepts/avr.md) — fights the Vₜ sag caused by load increases
