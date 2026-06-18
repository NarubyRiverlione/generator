# Bugs

> Triage 2026-06-17 — easy bugfixes (#1–#4) are concluded inline below.
> The power-factor/loadability item and the new-LCD-values item are tracked in the
> OpenSpec change **`low-pf-loadability-and-lcd-readouts`** (see "Tracked in the new change").

## not enough power

Because of the (realistic) added losses (saturation , load drops rpm,...) is wasn't possible anymore to go 100% load with power factor 0.85 and excitor 1.5

Changes made to max excitor to 1.7, which is fine for this learning project.
But:

- max load was also increased to 150%, which I didn't ask. 120% seems a nice value to experiment with.
- power factor is now fixed an 0.92, not changeable. It's ok to start the sim with 0.95 but it should be adjustable to al least 0.8 on full load
- adding max excitor needs also adjustments in the max value of the excitor and rectifier output gauges.
  (check if other adjustments are needed)

**Conclusion**

- **Max load 150 % → 120 %** — *done.* UI clamp updated in `App.tsx` (active-load knob `max`, `scaleMax`, `ptrRotation` divisor) + the `[0, 1.5]` comment in `types.ts`. Physics unaffected.
- **Power factor floor** — *tracked in the new change (#5); cap-removal already shipped.* The 0.92 floor was a real loadability limit, not an arbitrary lock: a probe of the core shows the saturation curve flat-caps EMF at Eₐ = 1.2, so full load collapses at 0.8 PF (0.85 PF already sags to 286 V, below the ANSI-27 trip). As an interim step the lagging floor was **removed (→ 0.6, symmetric with leading)** with no physics change — the knob now reaches low PF but the machine still collapses ~0.85–0.9 PF at full load. Making voltage actually *hold* at 0.8 PF (raise the saturation ceiling + default 0.95) remains in the change.
- **Exciter / rectifier gauge maxes** — *done (no change needed).* Already sized for 1.7: AC max `255 = 1.7×150`, DC `230 ≈ 0.9×255`, field `12 A > 1.7×6.67`, all in `ExciterChain.tsx`. No correctness bug — the only nit is the needle pegs at the top at full command. Left as-is; bump the maxes for visual headroom only if desired.

## ACTIVE POWER gauge

rated 400 V output should show as green. Adjust the max value of the gauge to it can should 420.
Change color bands: 0-390 orange, 390-410 green, 410-420 red
(think about if we need to change this to logarithmic scale )

**Conclusion** — *done.* Mislabeled: the 400 V content is the **TERMINAL Vₜ** gauge, not active power (confirmed with user). Fixed in `ReadoutPanel.tsx`: `Gauge` `max` 500 → 420, and rezoned `VT_ZONES` (0–390 orange, 390–410 green, 410–420 red, expressed as `/420` fractions). The "logarithmic scale?" musing is a separate design question, not part of this fix.

## LCD

- remove valve position as this has now it own position indicator.
- suggest if other meaningful values can be showed now that we have new factors coded (saturation, load droop, ... )

**Conclusion**

- **Remove valve position** — *done.* Dropped the `valve {valvePct}%` span in `StatusDisplay.tsx` `l3` and the matching sticky-note legend line. The valve keeps its dedicated `PositionIndicator`. This frees the `l3` slot for the new readouts below (#6).
- **New meaningful values (saturation, load droop)** — *tracked in the new change (#6).* Surface two derived signals: saturation derate (`saturation(iField)/iField`) and load-droop RPM (`Pe · govDroop · 1500`), both added to `Outputs` then shown on the LCD in the freed slot.

---

## Tracked in the new change

The power-factor floor removal (#5) and the new LCD readouts (#6) live in the OpenSpec change
**`low-pf-loadability-and-lcd-readouts`** (proposal + design + spec deltas for `simulation-core` and
`simulator-ui`). The proposal is reconciled to as-built: #5 (lagging floor → 0.6, realistic physics
kept, collapse exposed) is **implemented**; #6 (saturation-derate + droop-rpm outputs and LCD display)
is **still pending**. Raising the saturation ceiling and defaulting to 0.95 PF were considered and
rejected (design D1).
