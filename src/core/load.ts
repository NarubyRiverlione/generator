/** Constant-power load model. P and Q derived from sliders, independent of terminal voltage. */

export type LoadDemand = { p: number; q: number }

/**
 * Compute per-unit load demand.
 * Lagging (inductive) load: Q > 0.
 * Leading (capacitive) load: Q < 0.
 */
export function computeLoad(loadFraction: number, powerFactor: number, pfLag: boolean): LoadDemand {
  const safeLf = isFinite(loadFraction) ? Math.max(0, loadFraction) : 0
  const safePf = isFinite(powerFactor) ? Math.min(1, Math.max(0, powerFactor)) : 1
  const p = safeLf
  const tanPhi = Math.tan(Math.acos(safePf))
  const q = pfLag ? p * tanPhi : -p * tanPhi
  return { p, q }
}
