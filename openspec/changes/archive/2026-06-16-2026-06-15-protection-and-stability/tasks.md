## 1. Reconciliation (documentation only — code already shipped 2026-06-15)

- [x] 1.1 VSM computed in `machine.ts` before the collapse early-return, exposed as
      `Outputs.stabilityMargin`, guarded at Eₐ = 0 — confirmed
- [x] 1.2 VSM % shown on the LCD (amber < 20 %, red < 8 %) in `StatusDisplay.tsx` — confirmed
- [x] 1.3 ANSI-27 relay (trip 0.85 pu, arming, load-shed, dome reset, re-arm) in
      `useGeneratorSimulation.ts` + `App.tsx` — confirmed
- [x] 1.4 27-relay LED in `IndicatorLights.tsx` — confirmed
- [x] 1.5 Field-at-ceiling indicator in `IndicatorLights.tsx` — confirmed (visual verification pending per design notes)
- [x] 1.6 Old δ→90° load-angle warning no longer surfaced in the UI — confirmed
