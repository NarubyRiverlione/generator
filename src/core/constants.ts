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

export const DEFAULT_INPUTS: Inputs = {
  fieldVoltage: 0,
  loadFraction: 0,
  powerFactor: 0.85,
  pfLag: true,
  avrOn: false,
}
