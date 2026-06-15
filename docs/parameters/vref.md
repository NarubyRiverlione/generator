# Vref — AVR Voltage Reference

## What it is

The terminal voltage setpoint that the AVR tries to hold. When AVR is enabled, it continuously compares Vref to the measured Vₜ and adjusts the field voltage command to drive the error to zero.

## What determines it on a real machine

Set by the operator from the control room. On European grids the standard LV busbar is 400 V (line-to-line), so Vref is typically set at or near 1.0 pu (400 V). Small adjustments (±5%) are used to fine-tune reactive power sharing between parallel generators or to control reactive power flow to the grid.

## Realistic range

**0.95 – 1.05 pu** (380 – 420 V) in normal operation. Wider excursions are possible during testing or fault recovery but are not normal operating practice.

## Simulator value

Range **0.95 – 1.05 pu**, default **1.0 pu**. Only visible and active when AVR is on.

## Effect on the machine

- Raising Vref causes the AVR to command more field, raising Vₜ and increasing the reactive power Q supplied to the load.
- Lowering Vref causes the AVR to reduce field, lowering Vₜ. If lowered far enough with a lagging load, the 27 relay can trip.
- The AVR will raise field as high as needed (up to 1.5 pu ceiling) to reach Vref. If the load is too heavy to reach Vref even at the ceiling, the FIELD AT CEILING indicator lights and Vₜ settles below Vref.

## Related

- [Kp / Ki](kp-ki.md) — the PI gains that determine how the AVR chases Vref
- [Field voltage](field-voltage.md) — Vref indirectly commands field voltage through the AVR
- [AVR](../concepts/avr.md) — the full control loop that uses Vref
