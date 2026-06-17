/** Simulation step: field lag → AVR or manual target → machine solve. */

import { stepAvr } from './avr'
import { AVR_VREF, DEFAULT_INPUTS, JOG_FAST, JOG_SLOW, PARAMS, RPM_RATED, TAU_SPINUP, TAU_VALVE, VALVE_RPM_MAX } from './constants'
import { computeLoad } from './load'
import { solveMachine } from './machine'
import type { Inputs, Outputs, Params, SimState, ValveCommand } from './types'

function jogRate(cmd: ValveCommand): number {
  if (cmd === 2) return JOG_FAST
  if (cmd === 1) return JOG_SLOW
  if (cmd === -1) return -JOG_SLOW
  if (cmd === -2) return -JOG_FAST
  return 0
}

// Initial valve ~1495 rpm (slightly sub-synchronous; operator trims to 1500 for Phase 3 sync)
const VALVE_PCT_INIT = (1495 / VALVE_RPM_MAX) * 100   // ≈ 93.44 %
const SPEED_INIT_PU = 1495 / RPM_RATED                // ≈ 0.9967

export function initialState(): SimState {
  const inputs = DEFAULT_INPUTS
  const load = computeLoad(inputs.loadFraction, inputs.powerFactor, inputs.pfLag)
  const result = solveMachine(inputs.fieldVoltage * SPEED_INIT_PU, load.p, load.q, PARAMS.xs)
  const initRpm = SPEED_INIT_PU * RPM_RATED
  const initHz = initRpm / 30
  const outputs: Outputs = result.collapsed
    ? {
        vt: 0,
        ia: 0,
        delta: 0,
        p: 0,
        q: 0,
        pf: 1,
        avrCommand: inputs.fieldVoltage,
        collapsed: false,
        stabilityMargin: 0,
        frequencyHz: initHz,
        rpm: initRpm,
        valvePct: VALVE_PCT_INIT,
        valveActual: VALVE_PCT_INIT,
      }
    : {
        ...result,
        avrCommand: inputs.fieldVoltage,
        collapsed: false,
        frequencyHz: initHz,
        rpm: initRpm,
        valvePct: VALVE_PCT_INIT,
        valveActual: VALVE_PCT_INIT,
      }

  return {
    iField: inputs.fieldVoltage,
    avrIntegral: 0,
    valvePct: VALVE_PCT_INIT,
    valveActual: VALVE_PCT_INIT,
    speedLagged: SPEED_INIT_PU,
    lastValidOutputs: outputs,
  }
}

export type StepResult = { state: SimState; outputs: Outputs }

export function step(state: SimState, inputs: Inputs, params: Params, dt: number): StepResult {
  // AVR or manual field target
  let fieldTarget: number
  let avrCommand: number
  let avrIntegral: number

  if (inputs.avrOn) {
    const avr = stepAvr(AVR_VREF, state.lastValidOutputs.vt, state.avrIntegral, params.kp, params.ki, dt)
    fieldTarget = avr.command
    avrCommand = avr.command
    avrIntegral = avr.integral
  } else {
    fieldTarget = inputs.fieldVoltage
    avrCommand = inputs.fieldVoltage
    // Bumpless transfer: keep integral primed so AVR output = current fieldVoltage on engage.
    const error = AVR_VREF - state.lastValidOutputs.vt
    avrIntegral = params.ki !== 0 ? (inputs.fieldVoltage - params.kp * error) / params.ki : 0
  }

  // First-order field lag: iField chases target with time constant τ
  const iField = state.iField + (fieldTarget - state.iField) * (1 - Math.exp(-dt / params.tau))

  // 2.1 Integrate valve: holds when valveCommand = 0, clamped to [0, 100]
  const valvePct = Math.min(100, Math.max(0, state.valvePct + jogRate(inputs.valveCommand) * dt))

  // Valve actuator lag: physical valve position chases setpoint with τ_valve
  const valveActual = Math.min(100, Math.max(0, state.valveActual + (valvePct - state.valveActual) * (1 - Math.exp(-dt / TAU_VALVE))))

  // 2.2 Valve → RPM (shaft-primary); advance spin-up lag (exact-exponential, same form as field lag)
  const rpmTarget = (valveActual / 100) * VALVE_RPM_MAX
  const speedTarget_pu = rpmTarget / RPM_RATED
  const speedLagged = state.speedLagged + (speedTarget_pu - state.speedLagged) * (1 - Math.exp(-dt / TAU_SPINUP))

  // 2.3 Scale internal EMF by speed before circuit solve: Eₐ = field_lagged × speed_pu
  const ea = iField * speedLagged

  // 2.4 Derive readouts shaft-first: RPM → Hz (Hz is never an intermediate variable)
  const rpm = speedLagged * RPM_RATED
  const frequencyHz = rpm / 30

  // Machine solve
  const load = computeLoad(inputs.loadFraction, inputs.powerFactor, inputs.pfLag)
  const result = solveMachine(ea, load.p, load.q, params.xs)

  let outputs: Outputs
  if (result.collapsed) {
    // Freeze voltage outputs but keep shaft readouts live; valveActual is shaft-side — stays live
    outputs = { ...state.lastValidOutputs, avrCommand, collapsed: true, frequencyHz, rpm, valvePct, valveActual }
  } else {
    outputs = { ...result, avrCommand, collapsed: false, frequencyHz, rpm, valvePct, valveActual }
  }

  const nextState: SimState = {
    iField,
    avrIntegral,
    valvePct,
    valveActual,
    speedLagged,
    lastValidOutputs: result.collapsed ? state.lastValidOutputs : outputs,
  }

  return { state: nextState, outputs }
}
