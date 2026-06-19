/** Core domain types — all quantities in per-unit unless noted. */

export type ValveCommand = -2 | -1 | 0 | 1 | 2

export type Inputs = {
  /** Exciter field DC setpoint, per-unit [0.0, 1.7]. Read-only when AVR is on. */
  fieldVoltage: number
  /** Active load, fraction of rated [0, 1.2]. */
  loadFraction: number
  /** Power factor magnitude: [0.6, 1.0] both lagging and leading. Sign determined by pfLag. */
  powerFactor: number
  /** true = lagging (inductive), false = leading (capacitive). */
  pfLag: boolean
  /** Load breaker closed. When false, Pe = 0 regardless of load Knob; closing applies the full Knob value as one instantaneous step. */
  loadBreaker: boolean
  /** AVR enabled. */
  avrOn: boolean
  /** Governor enabled (isochronous PI on speed error → valve setpoint). */
  governorOn: boolean
  /** Fine raise/lower switch: ±1 slow jog, ±2 fast jog, 0 neutral (spring-return). */
  valveCommand: ValveCommand
  /** Coarse raise/lower switch: ±1 slow jog, ±2 fast jog, 0 neutral (spring-return). Rates 2× / 5× fine fast. */
  coarseValveCommand: ValveCommand
}

export type SimState = {
  /** Lagged field current, per-unit. */
  iField: number
  /** Exciter output after first-order exciter lag (τ_exciter); feeds the main field winding lag. */
  exciterLagged: number
  /** AVR PI integrator accumulator. */
  avrIntegral: number
  /** Governor PI integrator accumulator. */
  governorIntegral: number
  /** Valve position, % of full travel [0, 100]; 0 = closed = 0 rpm; ~93.75 = rated (1500 rpm). */
  valvePct: number
  /** Physical valve position (%), lags behind `valvePct` through actuator lag. */
  valveActual: number
  /** Integrated rotor speed, per-unit (1.0 = 1500 rpm). Evolved by the swing equation. */
  omega: number
  /** True when the previous solve was in the collapsed (voltage-collapse) state. Used to set Pe=0 (load rejection) in the swing equation so the rotor does not integrate against a phantom load. */
  collapsed: boolean
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
  /** Lagged field current, per-unit; the same signal used by the solver (not the AVR command). */
  iField: number
  /** AVR field command (per-unit); equals fieldVoltage when AVR off. */
  avrCommand: number
  /** Governor valve command (%), equals valvePct when governor off. */
  governorCommand: number
  /** true when load exceeds maximum loadability. */
  collapsed: boolean
  /**
   * Voltage stability margin [0, 1].
   * 1.0 = no load; 0.0 = nose point (about to collapse).
   * Based on discriminant / D_no_load; independent of PF and load angle.
   */
  stabilityMargin: number
  /** Output frequency, Hz; derived as rpm / 30 (shaft-primary: valve → RPM → Hz). */
  frequencyHz: number
  /** Shaft speed, RPM; derived as speedLagged × RPM_RATED. */
  rpm: number
  /** Valve position, % of full travel [0, 100]; mirrored from SimState. */
  valvePct: number
  /** Physical valve position (%), sourced from actuator-lagged state. */
  valveActual: number
  /**
   * Open-circuit saturation derate ratio `saturation(iField) / iField` (dimensionless).
   * 1.0 = field below the knee (no derate); <1.0 quantifies above-knee EMF-gain erosion.
   */
  saturationFactor: number
  /** Mechanical power in (pu); derived from valve position. Together with `p` gives the power imbalance Pm − Pe that the swing equation integrates. */
  pm: number
  /** Instantaneous damper-winding braking torque: D·(ω − ωref) (pu). Zero at synchronous speed; spikes transiently during load steps proportional to slip. */
  dampingTorque: number
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
