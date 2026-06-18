## Why

The twin-needle position indicator was designed to make the steam valve lag (TAU_VALVE = 2.0 s)
visible — setpoint needle vs actual needle drifting apart during a valve move. With the machine
reframed as a harbour tug diesel, the throttle lag will be revised to ~0.3 s. At that speed the
two needles are always nearly on top of each other — the instrument loses its educational value.

Additionally, throttle position is an important operational readout on a diesel generator that
should be immediately visible on the LCD alongside frequency and rpm.

## What Changes

- **Remove** the twin-needle position indicator from the UI layout
- **Keep** the React component — it may serve a future purpose (synchroscope phase angle,
  or reinstated if a steam variant is ever built from `islanded-baseline`)
- **Add** throttle % to the LCD — shows `valveActual` (physical throttle position, 0–100 %)
  as a live readout so the operator can see where the governor is commanding the fuel rack

## What Does Not Change

- The PositionIndicator component itself — untouched, just not rendered
- TAU_VALVE — that is a separate change (throttle lag correction)
- Governor behaviour — no physics changes
