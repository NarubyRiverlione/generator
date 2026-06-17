/** Piecewise-linear open-circuit saturation characteristic.
 * Breakpoints: (0,0) · (1.0,1.0) knee · (1.5,1.2) ceiling.
 */
export function saturation(field: number): number {
  if (field <= 0) return 0
  if (field <= 1.0) return field
  if (field >= 1.5) return 1.2
  // Linear interpolation: (1.0,1.0) → (1.5,1.2): slope = 0.2/0.5 = 0.4
  return 1.0 + (field - 1.0) * 0.4
}
