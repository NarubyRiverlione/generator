## Why

After Stage 3a the rotor has real inertia and the operator holds frequency **by hand** — feeling the
frequency sag on a load step and opening the valve to rebalance `Pm = Pe`. That manual struggle is the
lesson. But once it is understood, the operator should be able to flip on an automatic regulator and
watch it do the chase — exactly as the AVR already does for the voltage channel.

This stage adds the **automatic governor**: the precise twin of the AVR, closing the symmetry between the
two control channels.

```
   VOLTAGE / Q CHANNEL                 FREQUENCY / P CHANNEL
   manual: exciter field knob          manual: speed-changer (valve → Pm)
   auto:   AVR (default off)           auto:   GOVERNOR (default off)
           PI on (Vref − Vt)                   PI on (ωref − ω)
           → commands field                    → commands Pm (valve)
```

## What Changes

- **Add an automatic governor** to the simulation core: a controller that senses speed error
  `(ωref − ω)` and commands the valve / mechanical power `Pm` to hold rated frequency (50 Hz). Mirrors
  the AVR's PI structure and anti-windup.
- **Default off**, toggled by a selector switch, exactly like the AVR. When **on**, the speed-changer
  becomes read-only and displays the value the governor is commanding; when off, the speed-changer is
  manual (Stage 3a behaviour).
- **Isochronous** characteristic — restores frequency to exactly 50 Hz (correct for a single islanded
  machine). Droop-mode load sharing is explicitly a Phase 4 concern.
- **Governor-at-ceiling indicator** (valve can't open past 100 %) mirroring the existing
  field-at-ceiling indicator.

## Non-goals

- **No droop governor / load sharing** — isochronous only here; droop belongs to Phase 4 grid operation.
- **No grid, breaker, or synchronisation** — still islanded (Stage 3c).
- **No user-tunable governor gains** in this stage unless trivial — keep the first cut fixed-gain, matching
  how the AVR began (gain tuning can mirror the saturation/AVR-tuning change later).
- No change to the swing equation itself (Stage 3a) or the voltage channel.

## Capabilities

### Modified Capabilities

- `simulation-core`: add the isochronous governor controller acting on speed error → Pm command, with
  default-off gating and anti-windup.
- `simulator-ui`: add the governor on/off selector, make the speed-changer read-only when on (showing the
  commanded value), and add a governor-at-ceiling indicator.

## Impact

- Affected specs: `simulation-core`, `simulator-ui`.
- Affected code: `src/core/simulation.ts` (governor step, mirroring `stepAvr`), `src/core/constants.ts`
  (governor gains, `ωref`), `src/core/types.ts` (`governorOn` input, governor state), the input panel and
  status display components.
- Prerequisite: Stage 3a. Prerequisite for: full Phase 3 experience (sync with a regulated machine).
