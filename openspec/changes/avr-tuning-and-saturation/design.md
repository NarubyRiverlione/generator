## Context

Carved out of `phase-2-rpm-frequency-control`. These two decisions (D6, D7) were authored as part of
the original Phase 2 design but concern the excitation/voltage channel, not rotor speed. They are
preserved here verbatim in intent for a future controls-tuning phase.

## Decisions

### D6 — Magnetic saturation: piecewise linear open-circuit characteristic

**Decision:** Replace `Eₐ = field` (linear) with a piecewise linear function through three breakpoints:
- (0.0, 0.0) — no field, no EMF
- (1.0, 1.0) — rated field, rated Eₐ (linear knee)
- (1.5, 1.2) — ceiling field yields only 1.2 pu Eₐ (20 % saturation above knee)

**Rationale:** Real machines saturate above the air-gap line. The three-point curve is the minimal
representation that makes the AVR ceiling visible: doubling field current above the knee barely moves
Eₐ. This is the moment users notice the AVR "struggling" under heavy lagging load — it cannot pull Vₜ
back up simply by commanding more field. A smooth polynomial would be more accurate but the piecewise
form is transparent and easy to adjust if the shape feels wrong visually.

**Alternative considered:** IEEE polynomial saturation (exponential fit). Rejected — adds a fitting
parameter with no additional intuition; the knee effect is the key learning, not the exact curve shape.

### D7 — Second field time constant: stacked first-order lags

**Decision:** Replace the single τ = 1.5 s field lag with two stacked first-order lags:
τ_exciter = 0.4 s (exciter response) followed by τ_field = 1.1 s (main field winding L/R), giving the
same net 1.5 s DC gain but with an S-shaped step response that can overshoot under high AVR gain.

**Rationale:** With a single lag the AVR step response is monotone — there is nothing to tune Kp/Ki
against. Two lags give a second-order system with a characteristic frequency; high Kp causes overshoot
and ringing that users can observe and damp by reducing Kp or increasing Ki. This is the "aha" moment
for AVR tuning that a single lag cannot produce.

**Alternative considered:** Keep single τ and just expose Kp/Ki as adjustable. Rejected — with a
first-order plant a PI controller is unconditionally stable for any positive Kp, so tuning has no
consequence and the knobs feel inert.

## Interaction with Phase 2

Saturation multiplies the same internal EMF that rotor speed scales:
`Eₐ_pu = saturation(field_lagged) × speed_pu`. This change must therefore be applied after
`phase-2-rpm-frequency-control`, which introduces the `× speed_pu` factor.
