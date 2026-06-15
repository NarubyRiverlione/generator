/** Constant-power load model. P and Q derived from sliders, independent of terminal voltage. */

export type LoadDemand = { p: number; q: number }

/**
 * Compute per-unit load demand.
 * Lagging (inductive) load: Q > 0.
 * Leading (capacitive) load: Q < 0.
 */
export function computeLoad(loadFraction: number, powerFactor: number, pfLag: boolean): LoadDemand {
  const p = loadFraction
  const tanPhi = Math.tan(Math.acos(powerFactor))
  const q = pfLag ? p * tanPhi : -p * tanPhi
  return { p, q }
}
