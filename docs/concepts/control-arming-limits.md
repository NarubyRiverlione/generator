# Control Arming Limits — AVR & Automatic Governor

Both automatic controllers (AVR and isochronous governor) have an **underspeed arming threshold**:
the controller is silently inhibited below that speed and arms automatically once the shaft crosses it.

## Why arming limits exist

A synchronous machine at standstill or low speed is not a valid operating point for either controller:

- **AVR at standstill**: with `ω = 0`, the internal EMF is `Eₐ = field × 0 = 0` regardless of
  excitation. The AVR sees `Vt = 0`, error = 1.0 pu (maximum), and commands peak field indefinitely.
  The field winding carries DC current while the core is stationary — the flux is not swept across the
  rotor, so cooling is reduced. Real machines protect against this with an underspeed lockout on the
  excitation system.

- **Governor at low speed**: the governor is designed to regulate around rated speed (1.0 pu). From
  rest, the speed error is 1.0 pu — the largest it can ever be. Left to run, the PI integrator would
  drive the valve toward 100 % and perform a full-throttle spin-up. Real plant operators bring the unit
  to near-synchronous speed manually before handing off to the governor.

## Current limits

| Controller | Constant | Value | Approx. RPM |
|---|---|---|---|
| AVR | `OMEGA_AVR_ENABLE` | 0.80 pu | 1200 rpm |
| Automatic governor | *(not yet implemented — see below)* | — | — |

### AVR (`OMEGA_AVR_ENABLE = 0.80 pu`)

The AVR is treated as off whenever `state.omega < OMEGA_AVR_ENABLE`, even if the operator has
toggled it on. The PI integrator is kept primed during the inhibited period so engagement is
bumpless the instant the threshold is crossed — no field kick.

80 % of rated speed is a common industry reference point for underfrequency / underspeed protection
on the excitation system (IEC 60034-3 and manufacturer guides typically cite 80–85 % rated speed as
the lower limit for continuous excitation).

### Automatic governor

The governor arming limit is **not yet implemented**. Until it is, the governor should only be
enabled manually once the machine is near synchronous speed. Enabling it from cold-dark will cause
the governor to open the valve at full rate from rest, producing large transient load-angle
excursions (tested: δ reached 97° before settling).

A `OMEGA_GOV_ENABLE` constant at **0.90 pu (1350 rpm)** is planned — see the open stub
`openspec/changes/avr-governor-arming-limits/`.

## Open questions (tracked in `avr-governor-arming-limits` stub)

- Should arming thresholds use **hysteresis** (e.g. arm at 0.82, disarm at 0.78) to prevent
  chattering at the boundary?
- Should the UI show an **"AVR INHIBITED"** or **"GOV INHIBITED"** indicator distinct from
  "AVR ACTIVE" / "GOV ACTIVE"?
- **Volts-per-Hz protection (ANSI 24)**: a related limit — caps excitation as a function of
  frequency to prevent core saturation at low speed. Out of scope for Phase 3.
- **Phase 4 (grid connection)**: the AVR must be armed before the breaker closes. Arming logic
  designed for islanded operation may need adjustment for synchronisation sequences.
