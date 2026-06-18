## Why

The current governor uses fixed gains (`GOV_KP = 100`, `GOV_KI = 20`). These are tuned for fast
recovery but produce visible overshoot and hunting because the valve actuator lag (`TAU_VALVE = 2 s`)
makes the plant too slow for aggressive control — the valve is still moving when the speed error has
already changed sign.

The AVR already exposes Kp/Ki as adjustable sliders. The governor should too. Letting the learner
feel the tradeoff between recovery speed and overshoot is a more visceral PID lesson than any
textbook.

## The tradeoff to demonstrate

| Gain setting | Behaviour |
|---|---|
| High KP, high KI (current) | Fast response but overshoots, hunts around 50 Hz |
| Low KP, low KI | Slow, clean exponential approach — no overshoot |
| Mismatched (high P, low I) | Quick initial response, slow final correction |
| Mismatched (low P, high I) | Sluggish start, late windup overshoot |

Suggested well-tuned defaults to expose as starting point: `GOV_KP ≈ 20`, `GOV_KI ≈ 2`.
Current values stay in constants as a "aggressive" reference point.

## The plant constraint

With `TAU_VALVE = 2 s` there is a hard ceiling on how aggressive the controller can be and remain
stable. This is the key teaching point: **the plant sets the ceiling, not the designer's ambition**.
The derivative term (PID vs PI) would help here — it looks ahead at the rate of error change and
backs off before overshoot occurs. Connecting this to the damper winding (which does the same thing
mechanically on the rotor) is a strong parallel worth surfacing in the UI tooltip or concept doc.

## What changes

- Expose `GOV_KP` and `GOV_KI` as adjustable inputs (sliders with sensible ranges)
- Mirror the AVR pattern: ranges, defaults, labels
- Add a concept doc or tooltip explaining the plant-lag constraint
- Consider a "governor tuning" concept doc parallel to `docs/concepts/avr.md`

## Prerequisite for

Nothing — standalone improvement. Natural fit after Phase 3d (grid sync) when the governor's
role in frequency recovery is most visible.
