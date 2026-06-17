/**
 * Field step response tests (Task 4.2)
 * Covers field settling over time constant τ
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS } from '../../constants'
import { step } from '../../simulation'
import type { Inputs } from '../../types'
import { advanceTime } from '../helpers'

describe('4.2 field step settles over τ', () => {
  it('~63 % of step completed after 1τ', () => {
    const fieldStart = 1.0
    const fieldEnd = 1.4

    // Start settled at fieldStart with no load
    const inputs0: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldStart }
    const { state: settled } = advanceTime(inputs0, 10 * PARAMS.tau)

    // Step to fieldEnd and advance 1τ
    const inputsStep: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldEnd }
    const dt = 0.01
    let state = settled
    for (let i = 0; i < Math.round(PARAMS.tau / dt); i++) {
      const r = step(state, inputsStep, PARAMS, dt)
      state = r.state
    }

    const iField = state.iField
    const delta = fieldEnd - fieldStart
    const progress = (iField - fieldStart) / delta
    // Should be ~63 % (1 - 1/e ≈ 0.632)
    expect(progress).toBeGreaterThan(0.58)
    expect(progress).toBeLessThan(0.68)
  })

  it('essentially complete after 4τ (> 98 %)', () => {
    const fieldStart = 1.0
    const fieldEnd = 1.4

    // Pre-settle at fieldStart, then step to fieldEnd and advance 4τ
    const inputs0: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldStart }
    const { state: settled } = advanceTime(inputs0, 10 * PARAMS.tau)

    const inputsStep: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldEnd }
    const dt = 0.01
    let state = settled
    for (let i = 0; i < Math.round((4 * PARAMS.tau) / dt); i++) {
      state = step(state, inputsStep, PARAMS, dt).state
    }

    const progress = (state.iField - fieldStart) / (fieldEnd - fieldStart)
    expect(progress).toBeGreaterThan(0.98)
  })
})
