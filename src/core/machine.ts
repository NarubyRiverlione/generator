/**
 * Round-rotor machine solver.
 * Quadratic from design D2: (9/Xₛ²)·u² + (6Q/Xₛ − 9Eₐ²/Xₛ²)·u + (P² + Q²) = 0, u = Vₜ².
 * Rₐ is excluded from all solver calculations (power equation and Iₐ derivation); at Rₐ/Xₛ ≈ 4% the
 * effect on outputs is < 0.2% — below gauge resolution. Iₐ is derived from apparent power S = 3·Vₜ·Iₐ.
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
  // gives P_max = 3·Eₐ²/(2·Xₛ) ≈ 1.875 pu at rated field (Xₛ=0.8), covering the full slider range.
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

  // Load angle — guard against zero Vt or zero Ea (e.g. zero-excitation rest state)
  const sinDelta = vt > 1e-9 && ea > 1e-9 ? (p * xs) / (3 * vt * ea) : 0
  const delta = Math.asin(Math.max(-1, Math.min(1, sinDelta)))

  // Armature current per-phase magnitude from apparent power per-phase; zero at zero Vt
  const ia = vt > 1e-9 ? Math.sqrt(p * p + q * q) / (3 * vt) : 0

  // Calculated power factor; positive = lagging, negative = leading (per Q sign)
  const s = Math.sqrt(p * p + q * q)
  const pf = s > 0 ? (q >= 0 ? p / s : -(p / s)) : 1

  return { collapsed: false, vt, ia, delta, p, q, pf, stabilityMargin }
}
