## Why

The AVR and automatic governor each have an underspeed lockout hard-coded as a single constant
(`OMEGA_AVR_ENABLE = 0.8 pu`). As the simulator grows — grid connection, synchronisation, parallel
operation — these arming thresholds may need to become richer: per-control hysteresis, visible
arm/disarm indicators, and possibly a governor equivalent.

This change is a placeholder to think through what a proper arming-limits system looks like before
Phase 4 adds grid and sync scenarios where the conditions become more nuanced.

## What to Think Through

- **AVR underspeed**: current hard threshold at 0.8 pu. Should there be hysteresis (arm at 0.82,
  disarm at 0.78) to prevent chattering at the boundary?
- **Governor underspeed**: the automatic governor has no equivalent lockout. At very low speed the
  governor integral would wind up toward 100 % valve before the machine is spinning. Should a similar
  `OMEGA_GOV_ENABLE` guard be added?
- **UI feedback**: when AVR or governor is toggled on but inhibited by underspeed, the operator gets
  no feedback. An "AVR INHIBITED" or "GOV INHIBITED" indicator (distinct from "AVR ACTIVE") would
  make the arming state legible.
- **Over-speed limits**: real machines also have an over-speed trip on excitation (volts-per-Hz
  protection, ANSI 24). Out of scope for Phase 3 but worth noting.
- **Phase 4 interactions**: when a breaker closes onto a live grid, the AVR needs to be armed already.
  Arming logic that was fine for islanded operation may need adjustment.

## Non-goals (for now)

- No implementation in this stub — capture only.
- Volts-per-Hz (ANSI 24) protection is a separate change.
