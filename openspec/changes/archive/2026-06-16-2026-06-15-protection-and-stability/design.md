## Context

Implemented 2026-06-15. Three improvements; two fully exercised in the browser, one (field-at-ceiling)
coded but visual verification blocked by a dev-only React Strict Mode double-mount quirk (the RAF loop
holds the second mount's `inputsRef` while DevTools fiber-walk reaches the first mount's refs, so
scripted state injection is ignored — production single-mount is unaffected; verify by operating the
real knobs).

## Decisions

### D1 — Discriminant-based voltage stability margin (VSM)

The machine quadratic is `A·u² + B·u + C = 0` with `u = Vₜ²`. Its discriminant `D = B² − 4AC` goes
negative at the PV-nose (collapse). At no load `D_no_load = (9·Eₐ²/Xₛ²)²`. Define
**VSM = max(0, D) / D_no_load** ∈ [0, 1]: 1.0 = no load, 0.0 = nose point. VSM is independent of PF
angle, field level and operating point, which is why it replaces the δ thresholds that only worked at
unity PF.

**Invariant:** VSM is computed in `machine.ts` **before** the `discriminant < 0` early return — once
collapsed there is no margin to report. Guarded against Eₐ = 0 with `dNoLoad > 0 ? … : 0`.

### D2 — ANSI-27 under-voltage relay with startup-inhibit arming

Trip when `Vₜ < 0.85 pu` (`RELAY27_TRIP_VT`). The threshold (0.85 pu = 340 V) sits above the nose
voltage (≈ 0.57 pu at default params), so the relay always fires before the physics collapse — the
`collapsed` backstop becomes unreachable in normal use.

**Arming (startup inhibit):** `relay27ArmedRef` starts `false` and becomes `true` only once Vₜ has
risen above the threshold, so the relay does not fire during cold field build-up. RESET clears both
`relay27Ref` and `relay27ArmedRef`, so the relay must re-arm before it can fire again.

**Invariants:**
- The RAF tick order is **step physics → arm check → trip check**; that order matters.
- On trip the tick updates `inputsRef.current` **and** calls `setInputs` for load = 0 atomically —
  updating only one causes a one-frame race between the visible knob and the physics.
- `relay27ArmedRef` must be cleared on reset, else the relay re-trips immediately at the 0.85 boundary.

### D3 — Field-at-ceiling indicator

Amber when `avrOn && avrCommand ≥ AVR_COMMAND_MAX − 0.01` (AVR commanding ≥ ~1.49 pu): the regulator
has saturated and can no longer raise excitation to hold voltage. With default Xₛ = 1.2 at PF 0.85 lag
the ceiling is not reachable within the load range; to observe it, set PF to 0.6 lag and raise load
past ~86 %.

## Files (already shipped)

- `src/core/machine.ts` — computes `stabilityMargin` before the collapse return
- `src/core/types.ts` — `stabilityMargin` on `Outputs`
- `src/core/simulation.ts` — `stabilityMargin: 0` in the collapsed fallback
- `src/core/constants.ts` — `RELAY27_TRIP_VT = 0.85`
- `src/hooks/useGeneratorSimulation.ts` — relay state, refs, trip logic, `resetRelay27`
- `src/App.tsx` — relay banner/dome reset, passes `relay27Tripped` down
- `src/components/StatusDisplay.tsx` — VSM % line (amber/red)
- `src/components/IndicatorLights.tsx` — 27-relay LED, field-at-ceiling LED
