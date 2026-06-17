/**
 * Field step response tests (Task 4.2)
 * Covers field settling over time constant τ
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS } from '../../constants'
import { step } from '../../simulation'
import type { Inputs } from '../../types'
import { advanceTime } from '../helpers'

describe('4.2 field step settles over τ (second-order: exciter τ=0.4 s + field τ=1.1 s)', () => {
  it('S-shaped response: progress at 1 τ_field is less than a single-lag would give', () => {
    const fieldStart = 1.0
    const fieldEnd = 1.4

    // Start settled at fieldStart with no load
    const inputs0: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldStart }
    const { state: settled } = advanceTime(inputs0, 10 * PARAMS.tau)

    // Step to fieldEnd and advance 1 τ_field
    const inputsStep: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldEnd }
    const dt = 0.01
    let state = settled
    for (let i = 0; i < Math.round(PARAMS.tau / dt); i++) {
      const r = step(state, inputsStep, PARAMS, dt)
      state = r.state
    }

    const progress = (state.iField - fieldStart) / (fieldEnd - fieldStart)
    // Two stacked lags give S-shaped response: ~46 % at 1 τ_field (less than single-lag's ~63 %)
    expect(progress).toBeGreaterThan(0.35)
    expect(progress).toBeLessThan(0.58)
  })

  it('essentially complete after 6 τ_field (> 98 %)', () => {
    const fieldStart = 1.0
    const fieldEnd = 1.4

    // Pre-settle at fieldStart, then step to fieldEnd and advance 6 τ_field
    const inputs0: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldStart }
    const { state: settled } = advanceTime(inputs0, 10 * PARAMS.tau)

    const inputsStep: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldEnd }
    const dt = 0.01
    let state = settled
    for (let i = 0; i < Math.round((6 * PARAMS.tau) / dt); i++) {
      state = step(state, inputsStep, PARAMS, dt).state
    }

    const progress = (state.iField - fieldStart) / (fieldEnd - fieldStart)
    expect(progress).toBeGreaterThan(0.98)
  })
})
