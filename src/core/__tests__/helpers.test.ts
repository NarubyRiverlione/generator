/**
 * Tests for shared simulation helpers
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS } from '../constants'
import { initialState } from '../simulation'
import type { Inputs, SimState } from '../types'
import { advanceN, advanceTime, advanceWithState, stepN } from './helpers'

describe('helpers: advanceN', () => {
  it('advances n steps and returns state and outputs', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: 1.0, avrOn: false }
    const { state, outputs } = advanceN(inputs, 10, 0.01)

    expect(state).toBeDefined()
    expect(state.iField).toBeGreaterThan(0)
    expect(outputs).toBeDefined()
    expect(outputs.vt).toBeGreaterThan(0)
  })

  it('n=0 returns initial state', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: 0, avrOn: false }
    const { state, outputs } = advanceN(inputs, 0, 0.01)

    expect(state.iField).toBe(0)
    expect(outputs.vt).toBeCloseTo(0, 4)
  })
})

describe('helpers: advanceTime', () => {
  it('advances by total seconds', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: 1.0, avrOn: false }
    const { state: state1 } = advanceTime(inputs, 0.1) // 10 steps at 0.01
    const { state: state2 } = advanceN(inputs, 10, 0.01)

    // Should reach similar iField after same elapsed time
    expect(state1.iField).toBeCloseTo(state2.iField, 2)
  })

  it('uses default dt of 0.01 when not specified', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: 1.2, avrOn: false }
    const { state } = advanceTime(inputs, 0.05) // 5 steps

    expect(state.iField).toBeGreaterThan(0)
    expect(state.iField).toBeLessThan(1.2)
  })
})

describe('helpers: advanceWithState', () => {
  it('preserves starting state and advances from it', () => {
    // Start from a specific state
    const startState: SimState = { ...initialState(), iField: 0.5, exciterLagged: 0.5, speedLagged: 0.9 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: 1.0, avrOn: false }

    const { state } = advanceWithState(startState, inputs, 0.01, 0.01)

    // Should have advanced from 0.5, not started at 0
    expect(state.iField).toBeGreaterThan(0.5)
    // speedLagged may change slightly due to dynamics; check it's close to initial
    expect(state.speedLagged).toBeCloseTo(0.9, 1)
  })

  it('different inputs produce different results from same start state', () => {
    const startState: SimState = { ...initialState(), iField: 0.5 }
    const inputsLow: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0.8, avrOn: false }
    const inputsHigh: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.4, avrOn: false }

    const { state: stateLow } = advanceWithState(startState, inputsLow, 0.1, 0.01)
    const { state: stateHigh } = advanceWithState(startState, inputsHigh, 0.1, 0.01)

    // Higher field voltage should reach higher iField
    expect(stateHigh.iField).toBeGreaterThan(stateLow.iField)
  })
})

describe('helpers: stepN', () => {
  it('runs n steps while preserving state', () => {
    let state: SimState = initialState()
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: 1.0, avrOn: false }

    state = stepN(state, inputs, 5, 0.01)

    expect(state.iField).toBeGreaterThan(0)
    expect(state.iField).toBeLessThan(1.0)
  })

  it('chaining stepN calls accumulates changes', () => {
    let state: SimState = initialState()
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: 1.0, avrOn: false }

    state = stepN(state, inputs, 5, 0.01)
    const iField1 = state.iField

    state = stepN(state, inputs, 5, 0.01)
    const iField2 = state.iField

    // Second batch of steps should advance iField further
    expect(iField2).toBeGreaterThan(iField1)
  })

  it('n=0 returns unchanged state', () => {
    const state: SimState = { ...initialState(), iField: 0.3 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: 1.0, avrOn: false }

    const result = stepN(state, inputs, 0, 0.01)

    expect(result.iField).toBe(0.3)
  })
})
