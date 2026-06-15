/** Simulation step: field lag → AVR or manual target → machine solve. */

import { stepAvr } from './avr'
import { DEFAULT_INPUTS, PARAMS } from './constants'
import { computeLoad } from './load'
import { solveMachine } from './machine'
import type { Inputs, Outputs, Params, SimState } from './types'

export function initialState(): SimState {
  const inputs = DEFAULT_INPUTS
  const load = computeLoad(inputs.loadFraction, inputs.powerFactor, inputs.pfLag)
  const result = solveMachine(inputs.fieldVoltage, load.p, load.q, PARAMS.xs)
  const outputs: Outputs =
    result.collapsed
      ? { vt: 0, ia: 0, delta: 0, p: 0, q: 0, pf: 1, avrCommand: inputs.fieldVoltage, collapsed: false }
      : { ...result, avrCommand: inputs.fieldVoltage, collapsed: false }

  return {
    iField: inputs.fieldVoltage,
    avrIntegral: 0,
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
    const avr = stepAvr(inputs.vref, state.lastValidOutputs.vt, state.avrIntegral, params.kp, params.ki, dt)
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

  // Machine solve
  const load = computeLoad(inputs.loadFraction, inputs.powerFactor, inputs.pfLag)
  const result = solveMachine(iField, load.p, load.q, params.xs)

  let outputs: Outputs
  if (result.collapsed) {
    outputs = { ...state.lastValidOutputs, avrCommand, collapsed: true }
  } else {
    outputs = { ...result, avrCommand, collapsed: false }
  }

  const nextState: SimState = {
    iField,
    avrIntegral,
    lastValidOutputs: result.collapsed ? state.lastValidOutputs : outputs,
  }

  return { state: nextState, outputs }
}
