## Why

The Phase 1 UI used sliders, a two-column layout, and an adjustable AVR voltage-reference slider.
The shipped UI (commit `7ff46ac`) replaced these with rotary knobs and a switchboard-grid panel,
reduced AVR to an on/off selector switch, and fixed the voltage reference at rated. The canonical
`simulator-ui` spec still describes the old controls, so it no longer matches the code.

This change documents the shipped UI; it specifies no new implementation.

## What Changes

- `simulator-ui`:
  - Input controls are rotary **knobs**, not sliders; the exciter field default is **0 pu** and
    active-load default is **0 %**.
  - AVR is an **on/off selector switch**; the AVR voltage-reference slider is removed and Vref is
    **fixed at rated (1.0 pu / 400 V)**. The field knob is read-only and shows the commanded value
    while AVR is on.
  - The layout requirement is updated from a two-column layout to the **switchboard grid**.

## Capabilities

### Modified Capabilities
- `simulator-ui`: knobs not sliders, AVR selector + fixed Vref, switchboard layout.

## Impact

- No code changes — documentation reconciliation of shipped behaviour.
- Sequenced after `2026-06-15-protection-and-stability`; the two changes touch disjoint requirements
  in `simulator-ui` (this one modifies the input/AVR/layout requirements; protection adds the
  VSM/relay/ceiling requirements and removes the load-angle warning).
- Together with the protection change, this makes the canonical specs match `main` and unblocks the
  `phase-2-rpm-frequency-control` rebase.
