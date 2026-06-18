/**
 * No-load edge case tests (Task 4.1)
 * Covers Vₜ ≈ Eₐ, Iₐ ≈ 0 under no-load conditions.
 *
 * With the swing equation: valve must be closed (Pm=0) when Pe=0 so dω/dt=0 and
 * omega stays at the seeded value. An open valve with no load accelerates the rotor.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS } from '../../constants'
import { initialState } from '../../simulation'
import type { Inputs, SimState } from '../../types'
import { advanceWithState } from '../helpers'

describe('4.1 no-load edge', () => {
  it('Vt equals field current and Ia is near zero at zero load', () => {
    // Seed omega=1.0, valve closed (Pm=0), Pe=0 → dω/dt=0 → omega stays at 1.0
    const seeded: SimState = { ...initialState(), omega: 1.0, valvePct: 0, valveActual: 0, collapsed: false }
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, avrOn: false, fieldVoltage: 1.0 }
    const { outputs } = advanceWithState(seeded, inputs, 10 * PARAMS.tau)
    expect(outputs.vt).toBeCloseTo(1.0, 2)
    expect(outputs.ia).toBeLessThan(0.01)
    expect(outputs.collapsed).toBe(false)
  })

  it('no-load Vt tracks non-default field voltage (saturation applies above knee)', () => {
    // saturation(1.3) = 1.0 + (1.3 − 1.0) × 0.4 = 1.12; omega=1.0 → Vt ≈ 1.12
    const seeded: SimState = { ...initialState(), omega: 1.0, valvePct: 0, valveActual: 0, collapsed: false }
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, avrOn: false, fieldVoltage: 1.3 }
    const { outputs } = advanceWithState(seeded, inputs, 10 * PARAMS.tau)
    expect(outputs.vt).toBeCloseTo(1.12, 2)
  })
})
