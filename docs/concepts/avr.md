# AVR — Automatic Voltage Regulator

## What it is

A closed-loop controller that automatically adjusts the exciter field voltage to hold terminal voltage Vₜ at a setpoint (Vref). Without it, the operator must manually chase Vₜ every time the load changes. With it, the machine holds voltage automatically.

The AVR is the voltage equivalent of a speed governor — same idea, different physical quantity.

## The control loop

```
Vref ──→ [+]──→ [PI controller] ──→ field voltage command ──→ [field lag τ] ──→ Eₐ ──→ Vₜ
          ↑                                                                              │
          └──────────────────────────────────────────────────────────────────────────────┘
                                      (feedback)
```

1. AVR measures Vₜ
2. Computes error: `e = Vref − Vₜ`
3. PI controller calculates a field voltage command
4. Command passes through the physical field lag (τ = 1.5 s) — the AVR cannot bypass this inertia
5. Field current changes → Eₐ changes → Vₜ moves
6. Loop repeats at every simulation step

## PI controller

```
command = Kp · e + Ki · ∫e dt
```

Clamped to [0.5, 1.5] pu. Anti-windup prevents the integrator from accumulating while the output is clamped (which would cause a large overshoot when the clamp releases).

| Gain | Value | Role |
|---|---|---|
| Kp = 2.0 | Proportional | Immediate response to voltage error |
| Ki = 0.5 | Integral | Eliminates steady-state offset |

## Key behaviours to observe

**AVR off → load increase:** Vₜ sags. The operator (you) must manually raise field voltage to compensate. The relationship between field and Vₜ is direct and visible.

**AVR on → load increase:** The AVR detects the Vₜ sag, ramps up field command, and Vₜ recovers to Vref. Watch the entire exciter chain react — exciter AC, rectified DC, field current all rise together.

**AVR at ceiling:** If load is high enough (especially at 0.6 lag PF), the AVR commands maximum field (1.5 pu) and still cannot hold Vₜ at Vref. The FIELD AT CEILING indicator lights. Vₜ settles below Vref and continues to sag as load rises. The 27 relay eventually trips.

## What the AVR cannot do

- Overcome the field lag — the physics of the field winding take time regardless of AVR gain
- Supply more reactive power than the machine's ceiling field allows
- Prevent a 27 relay trip if load genuinely exceeds capability

## Phase 2 note

In Phase 1, the single field lag (τ = 1.5 s) makes the AVR unconditionally stable for any positive Kp — there is nothing to tune against. Phase 2 introduces a second time constant, creating the possibility of overshoot and ringing. Kp/Ki tuning will become genuinely consequential then.

## Related

- [Vref](../parameters/vref.md) — the voltage setpoint the AVR chases
- [Kp / Ki](../parameters/kp-ki.md) — the tuning parameters of the PI controller
- [τ (field time constant)](../parameters/tau.md) — the physical inertia the AVR must overcome
- [Field voltage](../parameters/field-voltage.md) — what the AVR commands
- [Relay 27](relay-27.md) — the protection that trips when the AVR reaches its limit
