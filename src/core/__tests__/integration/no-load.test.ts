/**
 * No-load edge case tests (Task 4.1)
 * Covers Vₜ ≈ Eₐ, Iₐ ≈ 0 under no-load conditions.
 *
 * With windage always active, valve=0 no longer holds omega constant — the shaft
 * decelerates via WINDAGE_K·ω. Tests pre-settle iField and run briefly so windage
 * barely moves omega, letting us isolate the electrical no-load behaviour.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS } from '../../constants'
import { initialState } from '../../simulation'
import type { Inputs, SimState } from '../../types'
import { advanceWithState } from '../helpers'

describe('4.1 no-load edge', () => {
  it('Vt equals field current and Ia is near zero at zero load', () => {
    // Pre-settle iField; run briefly so windage-driven omega decay is negligible (<0.1 %).
    const seeded: SimState = { ...initialState(), omega: 1.0, valvePct: 0, valveActual: 0, iField: 1.0, exciterLagged: 1.0, collapsed: false }
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, avrOn: false, fieldVoltage: 1.0 }
    const { outputs } = advanceWithState(seeded, inputs, 0.1)
    expect(outputs.vt).toBeCloseTo(1.0, 2)
    expect(outputs.ia).toBeLessThan(0.01)
    expect(outputs.collapsed).toBe(false)
  })

  it('no-load Vt tracks non-default field voltage (saturation applies above knee)', () => {
    // saturation(1.3) = 1.0 + (1.3 − 1.0) × 0.4 = 1.12; omega ≈ 1.0 → Vt ≈ 1.12
    const seeded: SimState = { ...initialState(), omega: 1.0, valvePct: 0, valveActual: 0, iField: 1.3, exciterLagged: 1.3, collapsed: false }
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, avrOn: false, fieldVoltage: 1.3 }
    const { outputs } = advanceWithState(seeded, inputs, 0.1)
    expect(outputs.vt).toBeCloseTo(1.12, 2)
  })

  it('shaft decelerates when valve is closed (windage drags omega to zero)', () => {
    // With WINDAGE_K > 0, a spinning rotor with valve=0 and no load will coast to rest.
    const seeded: SimState = { ...initialState(), omega: 1.0, valvePct: 0, valveActual: 0, iField: 1.0, exciterLagged: 1.0, collapsed: false }
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, loadBreaker: false, avrOn: false, fieldVoltage: 1.0 }
    // After 5 minutes (300 s >> τ_coast ≈ 160 s), omega should be well below 50 % of rated
    const { outputs } = advanceWithState(seeded, inputs, 300, 0.5)
    expect(outputs.rpm).toBeLessThan(750)
  })
})
