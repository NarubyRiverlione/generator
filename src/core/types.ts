/** Core domain types — all quantities in per-unit unless noted. Frequency-free per design D4. */

export type Inputs = {
  /** Exciter field DC setpoint, per-unit [0.5, 1.5]. Read-only when AVR is on. */
  fieldVoltage: number
  /** Active load, fraction of rated [0, 1]. */
  loadFraction: number
  /** Power factor magnitude [0.6, 1.0]. Sign determined by pfLag. */
  powerFactor: number
  /** true = lagging (inductive), false = leading (capacitive). */
  pfLag: boolean
  /** AVR enabled. */
  avrOn: boolean
  /** AVR voltage reference, per-unit. Visible only when AVR is on. */
  vref: number
}

export type SimState = {
  /** Lagged field current, per-unit. */
  iField: number
  /** AVR PI integrator accumulator. */
  avrIntegral: number
  /** Last valid outputs — frozen on collapse. */
  lastValidOutputs: Outputs
}

export type Outputs = {
  /** Terminal voltage, per-unit. */
  vt: number
  /** Armature current, per-unit. */
  ia: number
  /** Load angle, radians. */
  delta: number
  /** Active power out, per-unit. */
  p: number
  /** Reactive power out, per-unit; >0 = supplying (lagging load). */
  q: number
  /** Calculated power factor (signed: positive lag, negative lead). */
  pf: number
  /** AVR field command (per-unit); equals fieldVoltage when AVR off. */
  avrCommand: number
  /** true when load exceeds maximum loadability. */
  collapsed: boolean
  /**
   * Voltage stability margin [0, 1].
   * 1.0 = no load; 0.0 = nose point (about to collapse).
   * Based on discriminant / D_no_load; independent of PF and load angle.
   */
  stabilityMargin: number
}

export type Params = {
  /** Synchronous reactance, per-unit. */
  xs: number
  /** Armature resistance, per-unit. */
  ra: number
  /** Field first-order time constant, seconds. */
  tau: number
  /** AVR proportional gain. */
  kp: number
  /** AVR integral gain. */
  ki: number
}
