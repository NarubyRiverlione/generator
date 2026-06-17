/** Simulation step: field lag → AVR or manual target → machine solve. */

import { stepAvr } from './avr'
import { AVR_VREF, DEFAULT_INPUTS, JOG_FAST, JOG_SLOW, PARAMS, POLES, TAU_SPINUP, VALVE_FREQ_HIGH, VALVE_FREQ_LOW } from './constants'
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

export function initialState(): SimState {
  const inputs = DEFAULT_INPUTS
  const load = computeLoad(inputs.loadFraction, inputs.powerFactor, inputs.pfLag)
  // speedLagged = 1.0 at init → Eₐ = field × 1.0 = field (Phase 1 equivalent)
  const result = solveMachine(inputs.fieldVoltage * 1.0, load.p, load.q, PARAMS.xs)
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
        frequencyHz: 50,
        rpm: 1500,
        valvePct: 50,
      }
    : {
        ...result,
        avrCommand: inputs.fieldVoltage,
        collapsed: false,
        frequencyHz: 50,
        rpm: 1500,
        valvePct: 50,
      }

  return {
    iField: inputs.fieldVoltage,
    avrIntegral: 0,
    valvePct: 50,
    speedLagged: 1.0,
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
    avrIntegral = 0
  }

  // First-order field lag: iField chases target with time constant τ
  const iField = state.iField + (fieldTarget - state.iField) * (1 - Math.exp(-dt / params.tau))

  // 2.1 Integrate valve: holds when valveCommand = 0, clamped to [0, 100]
  const valvePct = Math.min(100, Math.max(0, state.valvePct + jogRate(inputs.valveCommand) * dt))

  // 2.2 Map valve to target speed and advance spin-up lag (exact-exponential, same form as field lag)
  const speedTargetHz = VALVE_FREQ_LOW + (valvePct / 100) * (VALVE_FREQ_HIGH - VALVE_FREQ_LOW)
  const speedTarget_pu = speedTargetHz / 50
  const speedLagged = state.speedLagged + (speedTarget_pu - state.speedLagged) * (1 - Math.exp(-dt / TAU_SPINUP))

  // 2.3 Scale internal EMF by speed before circuit solve: Eₐ = field_lagged × speed_pu
  const ea = iField * speedLagged

  // 2.4 Derive speed readouts (shaft keeps spinning regardless of voltage collapse)
  const frequencyHz = 50 * speedLagged
  const rpm = (120 / POLES) * frequencyHz

  // Machine solve
  const load = computeLoad(inputs.loadFraction, inputs.powerFactor, inputs.pfLag)
  const result = solveMachine(ea, load.p, load.q, params.xs)

  let outputs: Outputs
  if (result.collapsed) {
    // Freeze voltage outputs but keep shaft readouts live
    outputs = { ...state.lastValidOutputs, avrCommand, collapsed: true, frequencyHz, rpm, valvePct }
  } else {
    outputs = { ...result, avrCommand, collapsed: false, frequencyHz, rpm, valvePct }
  }

  const nextState: SimState = {
    iField,
    avrIntegral,
    valvePct,
    speedLagged,
    lastValidOutputs: result.collapsed ? state.lastValidOutputs : outputs,
  }

  return { state: nextState, outputs }
}
