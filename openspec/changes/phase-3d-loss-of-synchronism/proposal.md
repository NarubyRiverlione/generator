## Why

With the machine coupled to the grid (Stage 3c), the rotor is held in step by the synchronising power
`Pmax · sin(δ)`. But that hold is conditional: the power-angle curve peaks at δ = 90°, and **past the
pull-out angle the restoring force reverses** — more angle gives *less* synchronising power, so the rotor
accelerates away and **slips a pole**. This is the defining failure mode of a synchronous machine, and the
most important consequence to make tangible: push too hard, or get disturbed too far, and you fall out of
step.

```
   Pe │        Pmax ___
      │           /    ‾‾\.        past 90°: more angle → LESS power
   Pm ├───────●──────────●·······  rotor can't be held → runs away → POLE SLIP
      │      / stable    : \  unstable
      └──┴──────────────┴─────┴──── δ
         0             90°   180°
```

The swing equation from Stage 3a already *produces* this behaviour (the equal-area criterion). This stage
**detects and dramatises** it rather than faking it.

## What Changes

- **Out-of-step detection (ANSI-78)**: monitor δ and slip `(ωgen − ωgrid)`; when δ swings past the
  pull-out angle and fails to recover (rotor runs away / pole slip), declare loss of synchronism.
- **Trip and island**: on detection, open the breaker, surface a trip banner and LED, and latch — reusing
  the existing **relay-27 arm/trip/latch/dome-reset pattern** in the driver hook. After the trip the
  machine returns to islanded dynamics (Stage 3a), where the operator can recover and re-synchronise.
- **Visible pole slip (optional but desired)**: as δ rotates through 360°, show the dramatic frequency/
  power surge so the learner *sees* the machine pulling out, not just a clean trip.
- **Ride-through vs slip**: a disturbance that peaks under the pull-out angle swings back and stays in
  step (stable); one that crosses over slips — the equal-area outcome, driven entirely by the existing
  swing equation.

## Non-goals

- **No new physics** — the swing equation (Stage 3a) and synchronising power (Stage 3c) already produce
  pole slip; this stage only adds *detection, protection, and presentation*.
- **No multi-machine / out-of-step blocking schemes** — single machine vs infinite bus only.
- **No fault simulation** (short circuits, etc.) — disturbances come from operator action (too much Pm,
  bad close), consistent with the PRD's "no fault simulation" scope.
- No change to the voltage channel or the governor beyond consuming the trip.

## Capabilities

### Modified Capabilities

- `simulation-core`: expose the signals needed for out-of-step detection (δ, slip, pull-out margin) and
  ensure the swing equation cleanly represents a pole slip (δ wrapping / runaway) without NaN.
- `simulator-ui`: add the ANSI-78 out-of-step relay (trip/latch/reset), the trip banner/LED, and the
  pole-slip presentation, following the relay-27 pattern.

## Impact

- Affected specs: `simulation-core`, `simulator-ui`.
- Affected code: `src/core/simulation.ts` (pull-out / runaway handling, slip output),
  `src/hooks/useGeneratorSimulation.ts` (ANSI-78 relay alongside relay-27), `src/core/types.ts`
  (slip/out-of-step outputs), status/relay UI components.
- Prerequisite: Stage 3c. Completes the Phase 3 arc; prerequisite for Phase 4 grid operation.
