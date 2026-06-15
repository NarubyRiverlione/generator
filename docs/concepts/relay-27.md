# Relay 27 — Under-Voltage Protection

## What it is

ANSI device number 27 is the under-voltage relay. It monitors terminal voltage and disconnects the load when Vₜ drops below a threshold, protecting the generator and connected equipment from sustained under-voltage.

On a real islanded generator, sustained under-voltage means the machine is being pushed beyond its ability to support the load. Disconnecting the load gives the machine a chance to recover.

## Trip threshold

**0.85 pu (340 V)** — this is above the nose point of the PV curve (≈ 0.57 pu at default parameters), so the relay always trips before physical voltage collapse. The physics backstop (discriminant < 0) exists in the model but is unreachable under normal operation because the relay fires first.

## Arming logic (startup inhibit)

The relay does not trip at startup, even though Vₜ starts at zero and rises through the 0.85 pu threshold during field build-up. A startup inhibit prevents a false trip:

1. On first power-up the relay is **unarmed**
2. The relay **arms** once Vₜ has risen above 0.85 pu (healthy voltage confirmed)
3. Only after arming can the relay **trip** if Vₜ falls back below 0.85 pu
4. After a **RESET**, the relay disarms and must re-arm again — this prevents an immediate re-trip while the field is still rebuilding after load disconnect

## Trip sequence in the simulator

1. Vₜ drops below 0.85 pu (caused by load too high for current field)
2. Relay trips: load fraction forced to 0, banner appears, red LED lights
3. Generator recovers: field current drives Vₜ back up with no load
4. Operator clicks RESET: banner clears, load control freed, relay disarmed
5. Vₜ climbs back above 0.85 pu: relay re-arms
6. Operator can now raise load again

## What to observe in the simulator

With AVR off, raise load fraction slowly from zero. Watch Vₜ sag as load increases. At some point (depends on field setting and PF) the relay trips. Then watch the recovery — with no load the field rebuilds Vₜ smoothly.

With AVR on, the AVR fights the sag. But if load is raised fast enough or PF is very lagging, the AVR hits its ceiling (1.5 pu field) and can no longer hold Vₜ. The FIELD AT CEILING indicator lights, followed shortly by the 27 trip.

## Related

- [Field voltage](../parameters/field-voltage.md) — too low a field setting under load causes the trip
- [Load fraction](../parameters/load-fraction.md) — too high a load causes the trip
- [Power factor](../parameters/power-factor.md) — lagging PF makes the trip more likely at lower load
- [Voltage stability margin](voltage-stability-margin.md) — VSM approaching zero precedes the trip
- [AVR](avr.md) — delays the trip by actively supporting Vₜ, but cannot prevent it if load exceeds capability
