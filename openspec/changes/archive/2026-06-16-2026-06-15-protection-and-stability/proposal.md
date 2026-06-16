## Why

The δ-based stability warnings (70° / 85°) never fired before voltage collapse: at PF 0.85 lag with
Xₛ = 1.2 the machine collapses at δ ≈ 26–29°, far short of 90°. The classical δ = 90° limit only holds
at unity PF. Meanwhile an islanded machine in reality has under-voltage protection that disconnects
load before collapse. This change replaces the unreachable angle warning with physics-correct
stability and protection indicators.

This change documents work already shipped in code (commits `8ff69a7`, `da4296b`, `dceb7b8`); it
specifies no new implementation. It supersedes the standalone session notes previously kept in this
folder (their substance is preserved in `design.md`).

## What Changes

- `simulation-core`: ADD a discriminant-based **voltage stability margin (VSM)** output, independent of
  power factor and operating point.
- `simulator-ui`:
  - ADD the **VSM readout** on the LCD (amber < 20 %, red < 8 %).
  - ADD the **ANSI-27 under-voltage relay** (trip at Vₜ < 0.85 pu, startup-inhibit arming, automatic
    load shed to 0, manual dome reset, re-arm after reset, LED + banner).
  - ADD the **field-at-ceiling indicator** (amber when the AVR command reaches its ceiling).
  - REMOVE the obsolete δ→90° load-angle stability warning — superseded by VSM + the ANSI-27 relay.

## Capabilities

### Modified Capabilities
- `simulation-core`: adds the VSM output requirement.
- `simulator-ui`: adds VSM/relay/ceiling indicators; removes the load-angle warning.

## Impact

- No code changes — documentation reconciliation of shipped behaviour.
- The collapse physics backstop (`Outputs.collapsed`) still exists in the core but is no longer
  surfaced in the UI, because the ANSI-27 relay sheds load before the nose point is reached.
