# τ — Field Time Constant

## What it is

How fast the rotor field current responds to a change in field voltage setpoint. When you move the exciter field knob, the field current does not snap to its new value instantly — it settles exponentially, reaching 63% of the change after one τ and essentially complete after 4–5 τ.

This is the inertia of the exciter chain. It exists because the rotor field winding is an inductor: the magnetic energy stored in it cannot change instantaneously.

## What determines it on a real machine

The inductance (L) and resistance (R) of the rotor field winding circuit:

```
τ = L / R
```

A large rotor with many field winding turns has high L. The resistance of the field circuit sets the denominator. On large machines this gives time constants of several seconds.

## Realistic range

| Machine size | Typical τ_field |
|---|---|
| Large turbo-generator (100+ MVA) | 3 – 8 s |
| Medium generator | 1.5 – 4 s |
| Small generator | 0.5 – 2 s |

Note: real exciter systems also have their own time constant (τ_exciter ≈ 0.2–0.5 s) which stacks with τ_field. Phase 1 uses a single combined τ. Phase 2 will split these into two stacked lags so AVR overshoot becomes visible.

## Simulator value

**1.5 s** — lower end of realistic, consistent with a small machine. Makes the settling animation clearly visible without being frustratingly slow.

For a large power plant generator (3–8 s), the AVR response would feel much more sluggish. The physics are identical; only the pace differs.

## Effect on the machine

τ does not affect the steady-state operating point — where the machine ends up is determined by field voltage and load. τ only determines *how long it takes to get there*.

- **Fast response (small τ):** field current reaches new setpoint quickly; Vₜ settles fast; AVR can be more aggressive without risk of overshoot.
- **Slow response (large τ):** field current lags far behind setpoint changes; AVR must be tuned carefully to avoid overshoot and ringing (see Phase 2).

## What to observe in the simulator

Move the exciter field knob and watch the exciter chain readouts (AC out → rectified DC → field current → Vₜ) settle over roughly 1.5 s. That settling curve is τ in action.

## Related

- [Field voltage](field-voltage.md) — the input that τ acts on
- [Kp / Ki](kp-ki.md) — AVR gains that must be tuned against τ; a slower τ requires lower gains to avoid overshoot
- [AVR](../concepts/avr.md) — the closed-loop behaviour of the AVR depends heavily on τ
