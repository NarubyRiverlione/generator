# Kp / Ki — AVR Proportional and Integral Gains

## What they are

The tuning parameters of the AVR's PI controller. They determine how aggressively the AVR reacts to a voltage error (Vref − Vₜ).

- **Kp (proportional gain):** Immediate reaction proportional to the current error. High Kp → fast initial response but risks overshoot.
- **Ki (integral gain):** Reaction that accumulates over time. Eliminates steady-state error — without Ki, a PI controller would never fully correct a persistent offset. Too high → slow oscillation.

## How the AVR uses them

```
field_command = Kp · error + Ki · ∫error dt
```

Where `error = Vref − Vₜ`. The result is clamped to [0.5, 1.5] pu with anti-windup on the integrator.

## What determines them on a real machine

Tuned by the commissioning engineer to match the specific machine's time constants and stability margins. A faster machine (smaller τ) can handle higher gains. A larger machine with a long field time constant needs more conservative tuning.

In Phase 1 the gains are fixed because the single first-order plant (one τ) is unconditionally stable for any positive Kp — there is nothing to tune against. The Saturation & AVR-tuning change (carved out of Phase 2) introduces a second time constant which creates the possibility of overshoot and ringing, making Kp/Ki tuning meaningful.

## Realistic range

| Parameter | Typical range | Simulator value |
|---|---|---|
| Kp | 0.5 – 10 | 2.0 |
| Ki | 0.1 – 2.0 | 0.5 |

## What to observe in the simulator

In Phase 1, toggling the AVR on and watching Vₜ recover under load shows the PI controller at work — but the response is always clean because the plant is first-order. The interesting tuning behaviour arrives in Phase 2.

## Related

- [τ (field time constant)](tau.md) — the plant time constant that Kp/Ki must be tuned against
- [Vref](vref.md) — the setpoint the PI controller drives Vₜ toward
- [AVR](../concepts/avr.md) — the full closed-loop picture
