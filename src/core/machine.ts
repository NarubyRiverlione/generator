/**
 * Round-rotor machine solver.
 * Quadratic from design D2: (9/Xₛ²)·u² + (6Q/Xₛ − 9Eₐ²/Xₛ²)·u + (P² + Q²) = 0, u = Vₜ².
 * Rₐ used in phasor derivation for Iₐ (D3); neglected in power-equation quadratic.
 * Q > 0 = supplying reactive (lagging load); Q < 0 = absorbing (leading load).
 */

export type MachineResult =
  | {
      collapsed: false
      vt: number
      ia: number
      delta: number
      p: number
      q: number
      pf: number
      stabilityMargin: number
    }
  | { collapsed: true }

export function solveMachine(ea: number, p: number, q: number, xs: number): MachineResult {
  const xs2 = xs * xs
  // Design D2 quadratic coefficients — the factor 9 comes from 3-phase power convention;
  // gives P_max = 3·Eₐ²/(2·Xₛ) ≈ 1.25 pu at rated field, covering the full slider range.
  const A = 9 / xs2
  const B = (6 * q) / xs - (9 * ea * ea) / xs2
  const C = p * p + q * q

  const discriminant = B * B - 4 * A * C
  // D at no-load (p=q=0): only the ea² term survives → (9ea²/xs²)²
  const dNoLoad = (9 * ea * ea) / xs2
  const stabilityMargin = dNoLoad > 0 ? Math.max(0, discriminant) / (dNoLoad * dNoLoad) : 0

  if (discriminant < 0) {
    return { collapsed: true }
  }

  const sqrtD = Math.sqrt(discriminant)
  // Upper root = stable high-voltage operating point
  const u = (-B + sqrtD) / (2 * A)

  if (u < -1e-9) {
    return { collapsed: true }
  }

  const vt = Math.sqrt(Math.max(0, u))

  // Load angle — consistent with design power equation P = 3·Vₜ·Eₐ/Xₛ·sinδ
  const sinDelta = (p * xs) / (3 * vt * ea)
  const delta = Math.asin(Math.max(-1, Math.min(1, sinDelta)))

  // Armature current per-phase magnitude from apparent power per-phase
  const ia = Math.sqrt(p * p + q * q) / (3 * vt)

  // Calculated power factor; positive = lagging, negative = leading (per Q sign)
  const s = Math.sqrt(p * p + q * q)
  const pf = s > 0 ? (q >= 0 ? p / s : -(p / s)) : 1

  return { collapsed: false, vt, ia, delta, p, q, pf, stabilityMargin }
}
