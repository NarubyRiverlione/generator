/** Governor PI controller on ω error. Integral anti-windup via integration halt at clamp limits. */

export type GovernorResult = { command: number; integral: number }

export function stepGovernor(
  omegaRef: number,
  omega: number,
  integralIn: number,
  kp: number,
  ki: number,
  dt: number,
): GovernorResult {
  const error = omegaRef - omega
  const newIntegral = integralIn + error * dt
  const raw = kp * error + ki * newIntegral

  const command = Math.max(0, Math.min(100, raw))

  // Anti-windup: freeze integral when saturated and error would deepen the saturation.
  const clamped = command !== raw
  const integral = clamped && (raw - command) * error > 0 ? integralIn : newIntegral

  return { command, integral }
}
