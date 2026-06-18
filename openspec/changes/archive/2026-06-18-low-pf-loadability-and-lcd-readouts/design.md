# Design

## Context

`openspec/bugs.md` items #5 (power factor clamped at 0.92) and #6 (LCD has no readout for the new
saturation / droop physics). The triage established that #5 is not a UI clamp problem — it is a machine
loadability limit. The question was whether to *mask* that limit (raise the saturation ceiling) or
*expose* it (remove the artificial floor and let the operator hit the wall).

## Evidence — loadability probe

Solving the existing core (`solveMachine`, Xₛ = 1.2) at full load across PF, at the saturation ceiling
Eₐ = 1.2 (the value `saturation(field)` returns for any field ≥ 1.5):

| PF (lag) | Vₜ @ 100 % load | Note |
|----------|-----------------|------|
| 0.95 | 1.000 pu (400 V) | OK |
| 0.92 | 0.941 pu (376 V) | OK (old floor) |
| 0.90 | 0.899 pu (360 V) | OK, VSM 15 % |
| 0.85 | 0.714 pu (286 V) | **below ANSI-27 (0.85)** |
| 0.80 | — | **collapsed** |

So below ~0.9 PF the machine cannot hold usable voltage at full load. The field-command ceiling (1.7) is
irrelevant — every command ≥ 1.5 maps to the same Eₐ = 1.2.

## Decision D1 — remove the floor, keep realistic physics (chosen)

Drop the lagging PF floor from 0.92 to **0.6** (symmetric with the leading side). Leave the saturation
curve and ceiling unchanged. The operator can now turn the knob into the low-PF region and **watch the
voltage sag past the ANSI-27 trip and collapse** under heavy load — the realistic consequence becomes the
teaching moment.

### Alternatives considered (rejected)

- **Raise the saturation ceiling to ~1.4** so the AVR can hold 400 V down to 0.8 PF at full load. This was
  the initial recommendation, but it makes the machine artificially stiff (weaker above-knee droop) and
  *hides* the very limit the exercise is meant to teach. Rejected in favour of realism.
- **Keep the 0.92 floor, raise only to 0.90.** Marginally more range but still fences off the instructive
  collapse region. Rejected.
- **PF floor scales with load.** Most realistic envelope, but adds load-dependent clamp logic the learner
  cannot see or predict. Rejected as over-engineered.

### Consequence

The default starting PF stays 0.92 (no change). The "make voltage hold at low PF" path is explicitly not
pursued; collapse near 0.85–0.9 PF at full load is expected and intended.

## Decision D2 — two new derived outputs for the LCD

Both are cheap derivations already computable inside `step`:

- **Saturation derate factor** = `iField > 0 ? saturation(iField) / iField : 1`. 1.0 = no saturation;
  at iField 1.7 ≈ 0.71 (a 29 % derate at Eₐ 1.2). Shown so the learner sees *why* extra field buys
  diminishing voltage — the direct readout of the curve they are pushing into.
- **Load-droop RPM offset** = `Pe · govDroop · RPM_RATED`. At full load (Pe = 1.0, govDroop = 0.04) =
  60 rpm. Shown so the learner connects active load to the RPM/frequency drop at fixed valve.

LCD placement: these replace the valve-position line freed by the bugfix pass. The valve still has its
dedicated position indicator, so no information is lost.
