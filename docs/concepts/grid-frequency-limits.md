# Grid Frequency Limits

## Why frequency matters

Grid frequency is the heartbeat of the power system. Every generator connected to the grid must rotate at exactly the speed that produces 50 Hz (or 60 Hz). If a generator's frequency drifts too far, it is disconnected to protect both itself and the grid.

## The three zones (IEC / ENTSO-E, 50 Hz systems)

| Zone | Frequency | RPM (4-pole) | Requirement |
|---|---|---|---|
| Normal operation | 49.5 – 50.5 Hz | 1485 – 1515 | Continuous, no restriction |
| Mandatory ride-through | 47.5 – 51.5 Hz | 1425 – 1545 | Must stay connected and support recovery |
| Under-frequency trip | < 47.5 Hz | < 1425 | Disconnect within seconds |
| Over-frequency trip | > 51.5 Hz | > 1545 | Disconnect within seconds |

The **mandatory ride-through band** is deliberate: when frequency sags (e.g. a large generator trips), the last thing the grid needs is more generators dropping off. Grid codes legally require machines to stay connected and keep producing power through the disturbance.

## What this means in practice

A 5 % load step on an islanded machine (governor off) drops frequency to around 48.7 Hz — well inside the ride-through band. If that machine were grid-connected and the disturbance came from the grid side, it would be required to stay on and ride it out. The governor then pulls frequency back toward 50 Hz.

Disconnect only occurs if frequency breaches 47.5 Hz — roughly a 2.5 Hz (5 %) deviation from rated. That requires a very large, sustained power imbalance that protection systems and governors have both failed to correct.

## Synchronisation window

The protection window is intentionally wide. The **synchronisation window** is much tighter — this is the tolerance required before a generator can be connected to a live grid:

| Parameter | Requirement |
|---|---|
| Frequency difference | < 0.1 – 0.2 Hz |
| Voltage difference | < 2 – 5 % |
| Phase angle at closing | < 10° |

At 48.7 Hz a machine is 1.3 Hz away from the grid — roughly 13× outside the sync window. Closing the breaker at that deviation produces a violent current surge and shaft torque spike. The correct procedure is always: governor to 50 Hz, AVR to match grid voltage, wait for the synchroscope to show phase alignment, then close.

## Why the damper winding matters here

Inside the ride-through band the machine must not only stay connected — it must remain *stable*. When grid frequency swings, the coupling between machine and grid creates an oscillating torque that can cause the rotor to hunt (swing back and forth around synchronous speed). Without damper windings this oscillation can grow until the machine loses synchronism and trips anyway. With damper windings the oscillation decays within one or two cycles, keeping the machine locked to the grid through the disturbance.

This is why the damper winding is a prerequisite for Phase 3d grid synchronisation.

## Related

- [Damper windings](damper-windings.md) — passive rotor stabiliser; essential for ride-through
- [AVR](avr.md) — holds terminal voltage to match grid during synchronisation
