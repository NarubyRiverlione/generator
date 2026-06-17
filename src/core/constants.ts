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

/** Turbine governor — fine-valve governing band (0 % = low end of band, not a closed valve). */
export const VALVE_FREQ_LOW = 47   // Hz at 0 % fine valve (1410 rpm)
export const VALVE_FREQ_HIGH = 53  // Hz at 100 % fine valve (1590 rpm)

/** Fine-valve jog rates (valve %/s). Inner slow stage; outer fast stage. */
export const JOG_SLOW = 5   // %/s  ≈ 9 rpm/s, 0.3 Hz/s
export const JOG_FAST = 25  // %/s  ≈ 45 rpm/s, 1.5 Hz/s

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
