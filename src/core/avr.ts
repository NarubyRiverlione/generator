/** AVR PI controller on Vₜ error. Integral anti-windup via integration halt at clamp limits. */

import { AVR_COMMAND_MIN, AVR_COMMAND_MAX } from './constants'

export type AvrResult = { command: number; integral: number }

export function stepAvr(vref: number, vt: number, integralIn: number, kp: number, ki: number, dt: number): AvrResult {
  const error = vref - vt
  const newIntegral = integralIn + error * dt
  const raw = kp * error + ki * newIntegral

  const command = Math.max(AVR_COMMAND_MIN, Math.min(AVR_COMMAND_MAX, raw))

  // Anti-windup: freeze integral when saturated and error would deepen the saturation.
  // Condition: (unsaturated_raw - clamped_command) and error have the same sign.
  const clamped = command !== raw
  const integral = clamped && (raw - command) * error > 0 ? integralIn : newIntegral

  return { command, integral }
}
