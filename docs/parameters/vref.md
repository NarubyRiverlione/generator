# Vref — AVR Voltage Reference

## What it is

The terminal voltage setpoint that the AVR tries to hold. When AVR is enabled, it continuously compares Vref to the measured Vₜ and adjusts the field voltage command to drive the error to zero.

## What determines it on a real machine

Set by the operator from the control room. On European grids the standard LV busbar is 400 V (line-to-line), so Vref is typically set at or near 1.0 pu (400 V). Small adjustments (±5%) are used to fine-tune reactive power sharing between parallel generators or to control reactive power flow to the grid.

## Realistic range

**0.95 – 1.05 pu** (380 – 420 V) in normal operation. Wider excursions are possible during testing or fault recovery but are not normal operating practice.

## Simulator value

**Fixed at 1.0 pu (400 V).** Vref is not exposed as a control in this simulator — when AVR is on it
always regulates terminal voltage to rated. (Adjustable Vref is real-machine behaviour, mainly used for
reactive-power sharing once grid-connected; it is intentionally out of scope here.)

## Effect on the machine

Although Vref is fixed in the simulator, the relationships it governs are still worth understanding:

- A higher reference would make the AVR command more field, raising Vₜ and the reactive power Q supplied; a lower reference would do the opposite, and if low enough with a lagging load the 27 relay could trip.
- At the fixed rated reference, the AVR raises field as high as needed (up to the 1.5 pu ceiling) to hold Vₜ at rated. If the load is too heavy to reach rated even at the ceiling, the FIELD AT CEILING indicator lights and Vₜ settles below rated.

## Related

- [Kp / Ki](kp-ki.md) — the PI gains that determine how the AVR chases Vref
- [Field voltage](field-voltage.md) — Vref indirectly commands field voltage through the AVR
- [AVR](../concepts/avr.md) — the full control loop that uses Vref
