/**
 * AVR second-order plant tests (Tasks 2.4–2.5)
 * Two-lag field model (τ_exciter + τ_field) makes the AVR step response second-order.
 */

import { describe, expect, it } from 'vitest'
import { AVR_VREF, DEFAULT_INPUTS, PARAMS } from '../../constants'
import { initialState, step } from '../../simulation'
import type { Inputs } from '../../types'
import { advanceTime } from '../helpers'

describe('2.4 high Kp causes Vt overshoot with second-order plant', () => {
  it('peak Vt exceeds Vref (1.0) before settling when Kp = 5.0', () => {
    const highKpParams = { ...PARAMS, kp: 5.0 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: true, loadFraction: 0, fieldVoltage: 0 }
    let state = initialState()
    let peakVt = 0
    const dt = 0.01
    for (let i = 0; i < Math.round(30 / dt); i++) {
      const r = step(state, inputs, highKpParams, dt)
      state = r.state
      if (r.outputs.vt > peakVt) peakVt = r.outputs.vt
    }
    expect(peakVt).toBeGreaterThan(AVR_VREF)
  })
})

describe('2.5 default Kp/Ki settles without sustained oscillation', () => {
  it('Vt is within 2 % of Vref after 20 s with default gains', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: true, loadFraction: 0, fieldVoltage: 0 }
    const { outputs } = advanceTime(inputs, 20)
    expect(outputs.vt).toBeGreaterThan(AVR_VREF - 0.02)
    expect(outputs.vt).toBeLessThan(AVR_VREF + 0.02)
  })
})
