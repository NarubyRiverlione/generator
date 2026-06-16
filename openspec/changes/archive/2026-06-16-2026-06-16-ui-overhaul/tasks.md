## 1. Reconciliation (documentation only — code already shipped)

- [x] 1.1 Input controls are `Knob` components; exciter field default `0`, active load default `0`
      in `DEFAULT_INPUTS` — confirmed
- [x] 1.2 AVR is an on/off selector (`AvrControl.tsx`); `AVR_VREF` fixed at 1.0; no Vref slider — confirmed
- [x] 1.3 Field knob read-only and showing the commanded value while AVR is on (`App.tsx`) — confirmed
- [x] 1.4 Layout is the 5-column switchboard grid (`App.tsx`, `.switchboard-grid`) — confirmed
