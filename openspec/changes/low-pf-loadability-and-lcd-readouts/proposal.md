## Why

Two bugs surfaced after the saturation / load-droop / governor work landed (see `openspec/bugs.md`):

- **#5 — Power factor was clamped at 0.92 lag.** The intent is to let the operator pull power factor down
  toward the low-PF inductive region and *feel* the reactive-load penalty. The 0.92 floor existed because
  the machine physically cannot hold voltage below it at full load: a numerical probe of the core shows
  the saturation characteristic flat-caps internal EMF at **Eₐ = 1.2**, so at full load 0.85 PF already
  sags to 286 V (below the ANSI-27 trip) and **0.8 PF collapses**. The decision (see design D1) was to
  **keep the realistic saturation physics** and instead **remove the artificial floor**, letting the knob
  reach the low-PF region where the operator can *experience* the voltage sag and collapse as the lesson —
  rather than raise the saturation ceiling to mask it.

- **#6 — The LCD has no window into the new physics.** Saturation derate and governor load-droop are now
  modelled but invisible. With the valve-position line moving out of the LCD (it has its own position
  indicator — handled in the separate bugfix pass), there is room to surface two values that make the new
  physics legible to a learner.

## What Changes

- **Remove the lagging power-factor floor** from 0.92 to **0.6**, symmetric with the existing leading
  floor. *(Shipped ahead as an interim step — see Status.)* The machine is left at its realistic
  saturation ceiling (Eₐ = 1.2), so under heavy load the operator will drive voltage below the ANSI-27
  trip and into collapse somewhere around 0.85–0.9 PF; that collapse is the intended pedagogy, not a
  defect.
- **Add two derived outputs** to the simulation core: a **saturation derate factor** (`saturation(iField)
  / iField`, 1.0 = unsaturated) and a **load-droop RPM offset** (`Pe · govDroop · RPM_RATED`, the RPM the
  active load is pulling below rated at fixed valve).
- **Display both new values on the LCD** as numeric readouts, replacing the slot freed by the
  valve-position line.

## Status

- **#5 (PF floor removal)** — **implemented** (`App.tsx` `handlePfChange` floor → 0.6, `scaleMin` label,
  `types.ts` comment). Done ahead of formal approval at the user's direction.
- **#6 (LCD readouts)** — **proposed, not yet implemented.**

## Non-goals

- **Raising the saturation ceiling** to make voltage *hold* at 0.8 PF, and **changing the default
  starting PF to 0.95**, were considered and **rejected** in favour of keeping realistic physics (design
  D1). The default starting PF stays 0.92.
- The valve-position removal from the LCD, the active-load max (150 → 120 %), the exciter/rectifier gauge
  headroom, and the terminal-voltage gauge rezone are the **separate easy-bugfix pass**, not this change.
- No change to the field-command ceiling (`AVR_COMMAND_MAX` stays 1.7), the AVR PI structure, the
  governor droop value, or the saturation curve.

## Capabilities

### Modified Capabilities

- `simulator-ui`: remove the lagging PF floor (→ 0.6); display the two new LCD values.

### Added Capabilities

- `simulation-core`: export the saturation-derate and load-droop-RPM signals for readout.

## Impact

- Affected specs: `simulation-core`, `simulator-ui`.
- Affected code: `src/App.tsx` (`handlePfChange` floor, knob `scaleMin` — done), `src/core/types.ts`
  (PF range comment — done; plus two new `Outputs` fields — pending), `src/core/simulation.ts` (compute
  the two signals — pending), `src/components/StatusDisplay.tsx` (LCD lines + sticky-note legend —
  pending).
- Behaviour shift for learners: the PF knob now reaches the low-PF region and the machine visibly sags
  and collapses under heavy reactive load — the realistic limit is now demonstrable rather than fenced
  off.
