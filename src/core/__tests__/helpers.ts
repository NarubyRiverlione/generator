/** Shared test helpers for core simulation tests */

import { PARAMS } from '../constants'
import { initialState, step } from '../simulation'
import type { Inputs, SimState } from '../types'

/**
 * Advance simulation from a fresh state by n steps
 */
export function advanceN(inputs: Inputs, n: number, dt: number) {
  let state = initialState()
  let outputs = state.lastValidOutputs
  for (let i = 0; i < n; i++) {
    const r = step(state, inputs, PARAMS, dt)
    state = r.state
    outputs = r.outputs
  }
  return { state, outputs }
}

/**
 * Advance simulation from a fresh state by total seconds
 */
export function advanceTime(inputs: Inputs, totalSeconds: number, dt = 0.01) {
  return advanceN(inputs, Math.round(totalSeconds / dt), dt)
}

/**
 * Advance simulation with a starting state by total seconds
 */
export function advanceWithState(
  startState: SimState,
  inputs: Inputs,
  totalSeconds: number,
  dt = 0.01,
): { state: SimState; outputs: ReturnType<typeof step>['outputs'] } {
  let state = startState
  let outputs = state.lastValidOutputs
  const n = Math.round(totalSeconds / dt)
  for (let i = 0; i < n; i++) {
    const r = step(state, inputs, PARAMS, dt)
    state = r.state
    outputs = r.outputs
  }
  return { state, outputs }
}

/**
 * Run n simulation steps while preserving state between steps
 * Used when you need fine control over state preservation
 */
export function stepN(state: SimState, inputs: Inputs, n: number, dt: number) {
  for (let i = 0; i < n; i++) {
    const r = step(state, inputs, PARAMS, dt)
    state = r.state
  }
  return state
}
