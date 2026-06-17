/** Fixed machine parameters and default inputs. */

import type { Inputs, Params } from './types'

export const PARAMS: Params = {
  xs: 1.2,
  ra: 0.05,
  tau: 1.5,
  kp: 2.0,
  ki: 0.5,
}

export const AVR_COMMAND_MIN = 0.5
export const AVR_COMMAND_MAX = 1.5
export const AVR_VREF = 1.0

/** Under-voltage relay (ANSI 27) trip threshold, per-unit. */
export const RELAY27_TRIP_VT = 0.85

/** Turbine governor — single intake valve, shaft-primary. 0 % = closed = 0 rpm. */
export const VALVE_RPM_MAX = 1600 // rpm at 100 % valve (overspeed trip, ~107 % rated)
export const RPM_RATED = 1500 // synchronous speed, 4-pole @ 50 Hz

/** Jog rates (valve %/s). Inner slow stage; outer fast stage. */
export const JOG_SLOW = 0.03125 // %/s = 0.5 rpm/s
export const JOG_FAST = 0.3125  // %/s = 5 rpm/s

/** Spin-up lag time constant (s). Shaft is slower than the field lag (τ_field = 1.5 s). */
export const TAU_SPINUP = 2.5

/** Pole count — 4-pole machine → 1500 rpm at 50 Hz. */
export const POLES = 4

export const DEFAULT_INPUTS: Inputs = {
  fieldVoltage: 0,
  loadFraction: 0,
  powerFactor: 0.85,
  pfLag: true,
  avrOn: false,
  valveCommand: 0,
}
