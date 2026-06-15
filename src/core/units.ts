/** Per-unit base and display conversions. Applied only at readout time, never inside the solver. */

export const S_BASE_VA = 1_000_000
export const V_LL_BASE = 400
export const F_RATED = 50

/** Per-unit phase voltage base (line-to-neutral), volts. */
export const V_BASE = V_LL_BASE / Math.sqrt(3)

/** Per-unit current base, amperes. */
export const I_BASE = S_BASE_VA / (Math.sqrt(3) * V_LL_BASE)

/** Per-unit active power base, watts. */
export const P_BASE_W = S_BASE_VA

/** Per-unit reactive power base, var. */
export const Q_BASE_VAR = S_BASE_VA

export function puToVolts(pu: number): number {
  return pu * V_LL_BASE
}

export function puToKW(pu: number): number {
  return (pu * P_BASE_W) / 1000
}

export function puToKVAR(pu: number): number {
  return (pu * Q_BASE_VAR) / 1000
}

export function puToAmps(pu: number): number {
  return pu * I_BASE
}

/** Exciter chain cascaded display constants (cosmetic, do not affect solver). */
export const K_AC = 150
export const K_RECT = 0.9
export const K_FIELD = 10 / 1.5

export function fieldToExciterAC(iFieldPu: number): number {
  return iFieldPu * K_AC
}

export function fieldToRectifiedDC(iFieldPu: number): number {
  return iFieldPu * K_AC * K_RECT
}

export function fieldToFieldCurrent(iFieldPu: number): number {
  return iFieldPu * K_FIELD
}
