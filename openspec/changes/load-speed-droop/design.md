## Context

The turbine-governor spec explicitly states that speed "SHALL NOT be derived from a power-balance / swing-equation integration in this phase." That constraint is what this change removes. Currently the speed integrator is a pure kinematic first-order lag toward a valve-derived target; load has zero effect on RPM. This is the most visible unrealism in the Phase 2 simulator: an operator can apply 100 % load and watch RPM stay exactly at 1500 rpm.

The change needs to be surgical — add load-induced speed droop without disrupting valve feel, startup behavior, or existing test semantics beyond the direct spin-up lag tests.

## Goals / Non-Goals

**Goals:**
- Speed drops when electrical load exceeds mechanical supply (valve held fixed).
- Speed recovers when the operator raises the valve to re-balance.
- No-load behavior (and startup) is unchanged.
- The response time from valve changes is preserved.

**Non-Goals:**
- Full swing-equation integration with rotor angle state (δ as separate state variable).
- Automatic governor droop feedback loop (isochronous control, AGC).
- Turbine model with steam chest lag or nonlinear valve curve.
- AVR interaction with speed changes (that is a separate Phase 3 topic).

## Decisions

### D1 — Droop-corrected speed target, not pure swing equation

**Model chosen:**
```
effectiveSpeedTarget = speedTarget_pu - Pe_prev × govDroop
speedLagged ← first-order lag toward effectiveSpeedTarget   (same exact-exponential form)
```

Where `Pe_prev = state.lastValidOutputs.p` (one step behind — standard explicit integration).

This is equivalent to steady-state droop formula:
```
ω_ss = ω_target - Pe × govDroop
```

**Why not the full swing equation (`dω/dt = (Pm - Pe) / 2H`)?**

The pure swing equation has no restoring force unless a governor feedback loop is added. Without feedback, the machine over-speeds at no load (Pm > 0 → dω/dt > 0 indefinitely), which makes the simulator unstable without operator action. That is correct for a governor-less machine but confusing for a teaching tool.

The droop-corrected first-order lag keeps the familiar speed-toward-valve behavior at no load while adding the load-induced offset. It is mathematically equivalent to a proportional governor with droop R, which is the standard simplified governor model in power-systems textbooks.

**Why not a separate inertia constant H?**

`H` and `govDroop` are related by `govDroop ≈ TAU_SPINUP / (2H)`, so they are not independent given the existing TAU_SPINUP. Adding H as a separate parameter adds one degree of freedom that the simulator cannot meaningfully expose without a more complex governor. `govDroop` maps directly to the observable quantity (% speed drop per % load) and is easier to explain.

### D2 — govDroop = 0.04 (4 % droop at full load)

At rated valve and full load:
```
Δω = 1.0 × 0.04 = 0.04 pu = 60 rpm
```
At rated valve and 50 % load:
```
Δω = 0.5 × 0.04 = 0.02 pu = 30 rpm
```

4 % is within the real 3–5 % standard governor droop band and produces a clearly visible RPM change without excessive deviation. Operators will need to raise the valve ~4 % to restore rated speed under full load, which teaches the manual load–frequency control task.

### D3 — Use Pe from the previous step

Speed is computed before `solveMachine` runs (because `ea = iField × speedLagged`). Using `state.lastValidOutputs.p` as Pe introduces a one-step lag of ~33 ms — negligible at the simulator cadence. This avoids a coupled solve and keeps the step function sequential.

When the machine is in a collapsed state, `Pe_prev` is frozen at the last valid value; the speed will drift toward the droop-corrected target based on that frozen Pe, which is correct (the machine is still loaded to whatever caused the collapse).

### D4 — TAU_SPINUP retained; govDroop added to Params

`TAU_SPINUP` stays as the kinematic response time constant (governs how fast speed chases the target after a valve move). Only the target itself changes. This decouples the two effects and requires the minimum code change.

## Risks / Trade-offs

- `[One-step Pe lag]` → Pe changes up to ~33 ms behind speed; imperceptible at this cadence and consistent with explicit integration practice.
- `[Droop is load-power-only]` → govDroop is applied to `p` (active power), not apparent power `s`. For unity-PF loads this is exact; for lagging loads it is a slight understatement of the total torque demand. Acceptable for Phase 2 scope.
- `[Collapsed state]` → Speed target uses frozen Pe from lastValidOutputs during collapse. This may cause unexpected speed behavior during sustained collapse — acceptable because collapse itself is an abnormal state.
- `[Test updates]` → Tests 3.3 and 3.5 test the kinematic speed lag in isolation. They must be updated to match the new steady-state (which now includes Pe correction). These tests were already patched in the previous change for the valve-actuator issue; extending the fix is low-risk.

## Migration Plan

1. Add `govDroop` to `Params` type and `PARAMS` constant.
2. In `simulation.ts`, subtract `state.lastValidOutputs.p * params.govDroop` from `speedTarget_pu` before the first-order lag step.
3. Update spec delta files.
4. Update or replace spin-up lag tests with droop-aware versions.
5. Verify: load increase → RPM drops; valve raise → RPM recovers.

## Open Questions

- None. The model is well-defined; parameter can be tuned post-implementation if the feel needs adjustment.
