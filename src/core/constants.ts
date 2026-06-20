/** Fixed machine parameters and default inputs. */

import type { Inputs, Params } from './types'

export const PARAMS: Params = {
  xs: 0.8,
  ra: 0.05,
  tau: 1.1,
  kp: 2.0,
  ki: 0.5,
}

/** Exciter first-order lag (s). Feeds into the main field winding lag (τ = PARAMS.tau). */
export const TAU_EXCITER = 0.4

export const AVR_COMMAND_MIN = 0.5
export const AVR_COMMAND_MAX = 1.7
export const AVR_VREF = 1.0

/** Under-voltage relay (ANSI 27) trip threshold, per-unit. */
export const RELAY27_TRIP_VT = 0.85

/** Turbine governor — single intake valve, shaft-primary. 0 % = closed = 0 rpm. */
export const VALVE_RPM_MAX = 1600 // rpm at 100 % valve (overspeed trip, ~107 % rated)
export const RPM_RATED = 1500 // synchronous speed, 4-pole @ 50 Hz

/**
 * Maximum mechanical power in (pu) at 100 % valve.
 * Anchored so Pm = 1.0 pu at the rated valve position (RPM_RATED / VALVE_RPM_MAX = 93.75 %).
 */
export const PM_MAX = VALVE_RPM_MAX / RPM_RATED // ≈ 1.0667

/**
 * Rotor inertia constant (s of stored kinetic energy at rated speed).
 * Sets the run-up timescale and frequency-drift rate under power imbalance.
 * Feel-tunable: larger H = slower drift and longer run-up.
 */
export const INERTIA_H = 4

/** Damper winding coefficient (pu). Viscous drag proportional to slip: D·(ω − ωref).
 * Zero at synchronous speed; set to 0 to restore undamped pure-integrator behaviour. */
export const DAMPING_D = 0.05

/** Fine jog rates (valve %/s). Inner slow stage; outer fast stage. */
export const JOG_SLOW = 0.03125 // %/s = 0.5 rpm/s
export const JOG_FAST = 0.3125 // %/s = 5 rpm/s

/** Coarse jog rates retained for reference (SpringLoadedSelector component kept, not mounted). */
export const JOG_COARSE_SLOW = 0.625 // %/s = 10 rpm/s
export const JOG_COARSE_FAST = 1.5625 // %/s = 25 rpm/s

/** Idle speed target for the START button (rpm). Deliberately below the load-breaker arming threshold (~1425 rpm). */
export const IDLE_RPM = 1400
/** Valve position (%) corresponding to IDLE_RPM. START ramps the throttle to this point. */
export const IDLE_VALVE_PCT = (IDLE_RPM / VALVE_RPM_MAX) * 100 // 87.5 %

/**
 * Minimum rotor speed (pu) before the AVR is allowed to arm.
 * Below this threshold the AVR is inhibited (treated as off) to prevent
 * standstill excitation — mirroring real underspeed protection on synchronous machines.
 * 0.8 pu ≈ 1200 rpm (80 % of rated).
 */
export const OMEGA_AVR_ENABLE = 0.8
/** AVR disarm hysteresis threshold (pu). AVR stays armed until omega drops below this. */
export const OMEGA_AVR_DISABLE = 0.77

/**
 * Minimum rotor speed (pu) before the governor PI is allowed to arm.
 * Derived from IDLE_RPM so both stay in sync: governor becomes available exactly when START
 * has finished its job (~1400 rpm / 0.933 pu). Prevents integral windup during run-up.
 */
export const OMEGA_GOV_ENABLE = IDLE_RPM / RPM_RATED // ≈ 0.9333
/** Governor disarm hysteresis threshold (pu). Governor stays armed until omega drops below this. */
export const OMEGA_GOV_DISABLE = 0.90

/** Governor PI — isochronous, error in pu speed, command in valve %. */
export const OMEGA_REF = 1.0
export const GOV_KP = 100
export const GOV_KI = 20
/** Maximum governor valve rate of change (%/s). Prevents aggressive slams that stress the shaft. */
export const GOV_RATE_LIMIT = 10

/** Valve actuator lag time constant (s). Diesel fuel rack (~0.3 s); a steam intake valve would be ~2.0 s. */
export const TAU_VALVE = 0.3

/**
 * Mechanical windage + bearing friction coefficient (pu).
 * Always-active drag: dω/dt includes −WINDAGE_K·ω / (2H).
 * At rated speed this dissipates WINDAGE_K pu of mechanical power; the governor
 * compensates at normal loads. Sets the shaft coast-down time constant:
 * τ_coast = 2H / WINDAGE_K = 8 / 0.05 = 160 s.
 */
export const WINDAGE_K = 0.05

/** Pole count — 4-pole machine → 1500 rpm at 50 Hz. */
export const POLES = 4

export const DEFAULT_INPUTS: Inputs = {
  fieldVoltage: 0,
  loadFraction: 0,
  powerFactor: 0.92,
  pfLag: true,
  loadBreaker: false,
  avrOn: false,
  governorOn: false,
  valveCommand: 0,
  engineCommand: null,
}
