## Observation

Machine stable at 1500 rpm, no load. A 5 % load step causes an immediate ~40 rpm drop
(1500 → ~1460 rpm) before the governor recovers. This is too large a transient for a machine
that will need to synchronise to a live grid in Phase 3c/3d.

## Why it happens

Three factors compound:

1. **Undamped swing equation** — the simulator has no damping term `D·(ω − 1)`. Real machines have
   mechanical damping (damper windings, windage) that absorbs the first fraction of a load step
   without speed change. Without it, 100 % of the power imbalance goes straight into rotor
   deceleration.

2. **Governor rate limiter** — the 10 %/s valve rate cap (added to prevent shaft slams) means the
   governor cannot open the valve fast enough in the first ~1 s to arrest the initial drop. The
   trade-off between "no slam" and "fast response" is now visible.

3. **Inertia constant H = 4 s** — at 5 % load step, `dω/dt = ΔP / (2H) = 0.05 / 8 = 0.00625 pu/s`.
   Over one governor rate-limit cycle (~1 s to open 10 %), that is ~0.00625 pu = ~9 rpm/s of
   deceleration before Pm catches up. The observed ~40 rpm implies the mismatch persists for
   several seconds — consistent with the governor's gradual ramp-up through the rate limiter.

## Why it matters for Phase 3c / 3d

When the machine is connected to a live grid (or synchronising to one), a 40 rpm (2.7 Hz) frequency
excursion on a minor load change would immediately pull the machine out of synchronism or trigger
protection. Acceptable transient frequency deviation for grid-connected operation is typically
< 0.5 Hz (< 15 rpm).

## Options to investigate

- **Add a damping term** `D·(ω − ωref)` to the swing equation — small D (e.g. 0.05) represents
  damper winding effect without making the machine self-regulating at iso. This is the most
  physically correct fix.
- **Raise the governor rate limit** for small errors — a two-stage rate cap (fast response near
  rated speed, slow cap only during spin-up) would let the governor react quickly to load steps
  while still preventing spin-up slams.
- **Reduce governor dead-band sensitivity** — currently the PI responds to any error; a small
  dead-band (±0.2 %) could reduce hunting without slowing the large-signal response.
- **Tune H** — reducing the inertia constant makes the machine lighter and the governor response
  relatively faster, but changes the educational feel of the spin-up.

## Phase dependency

Do not address until Phase 3c (grid connection) is being designed, so the fix can be
validated against the sync scenario rather than in isolation.
