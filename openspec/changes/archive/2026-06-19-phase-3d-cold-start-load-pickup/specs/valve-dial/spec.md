## REMOVED Requirements

### Requirement: Twin-needle position indicator component

**Reason:** At `TAU_VALVE = 0.3 s` (diesel throttle) the setpoint and actual needles are nearly always
coincident — the actuator lag is short enough that the gap is never observable at normal simulation
cadence. The instrument loses its educational value and the panel slot is better used for the throttle-%
LCD tile that communicates the same information numerically.

The `PositionIndicator` component itself is **retained in the codebase** — it may serve the
synchroscope display (Phase 4) or a steam-plant variant that uses a longer valve lag.

**Migration:** The `PositionIndicator` component is no longer mounted in `App.tsx` at row 1 / col 6.
The col-6 row-1 slot in the switchboard grid is freed. Import and component definition remain; remove
only the JSX mount point and any props wired to `outputs.valvePct` / `outputs.valveActual` for the
panel slot. The throttle-% LCD tile in `StatusDisplay` replaces the readout.

### Requirement: Circular bezel

**Reason:** Retired with the panel mount (see above). The component's circular bezel styling is
retained in the component file for future use.

**Migration:** No action required — the style is in `PositionIndicator.tsx` which is not deleted.

### Requirement: 270° arc with tick marks

**Reason:** Retired with the panel mount (see above).

**Migration:** No action required.
