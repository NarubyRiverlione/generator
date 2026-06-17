/**
 * No-load edge case tests (Task 4.1)
 * Covers Vₜ ≈ Eₐ, Iₐ ≈ 0 under no-load conditions
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS } from '../../constants'
import type { Inputs } from '../../types'
import { advanceTime } from '../helpers'

describe('4.1 no-load edge', () => {
  it('Vt equals field current and Ia is near zero at zero load', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, avrOn: false, fieldVoltage: 1.0 }
    // Settle for 10 τ
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.vt).toBeCloseTo(1.0, 2)
    expect(outputs.ia).toBeLessThan(0.01)
    expect(outputs.collapsed).toBe(false)
  })

  it('no-load Vt tracks non-default field voltage (saturation applies above knee)', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, avrOn: false, fieldVoltage: 1.3 }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    // saturation(1.3) = 1.0 + (1.3 − 1.0) × 0.4 = 1.12; speed ≈ 0.997 → Vt ≈ 1.116
    expect(outputs.vt).toBeCloseTo(1.12, 2)
  })
})
