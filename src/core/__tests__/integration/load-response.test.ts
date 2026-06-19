/**
 * Load response tests (Tasks 4.3–4.4)
 * Covers load increase with AVR off/on, Vₜ and δ behavior
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS } from '../../constants'
import type { Inputs } from '../../types'
import { advanceTime } from '../helpers'

describe('4.3 load increase with AVR off', () => {
  it('Vt drops as load increases', () => {
    const base: Inputs = { ...DEFAULT_INPUTS, avrOn: false, fieldVoltage: 1.0, powerFactor: 0.85, pfLag: true, loadBreaker: true }
    const low: Inputs = { ...base, loadFraction: 0.2 }
    const high: Inputs = { ...base, loadFraction: 0.8 }

    const { outputs: outLow } = advanceTime(low, 10 * PARAMS.tau)
    const { outputs: outHigh } = advanceTime(high, 10 * PARAMS.tau)

    expect(outHigh.vt).toBeLessThan(outLow.vt)
  })

  it('δ increases monotonically with load', () => {
    // Use unity PF (Q=0) so P_max ≈ 1.25 and no collapse in this range
    const loads = [0.1, 0.3, 0.5, 0.7, 0.9]
    const deltas = loads.map((lf) => {
      const inputs: Inputs = {
        ...DEFAULT_INPUTS,
        avrOn: false,
        fieldVoltage: 1.0,
        loadFraction: lf,
        powerFactor: 1.0,
        pfLag: true,
        loadBreaker: true,
      }
      const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
      return outputs.delta
    })

    for (let i = 1; i < deltas.length; i++) {
      expect(deltas[i]).toBeGreaterThan(deltas[i - 1])
    }
  })
})

describe('4.4 load increase with AVR on', () => {
  it('AVR holds Vt within tolerance of 1.0 pu under increased load', () => {
    // Unity PF so P_max ≈ 1.25; 60% load is well within range with AVR headroom
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      avrOn: true,
      loadFraction: 0.6,
      powerFactor: 1.0,
      pfLag: true,
      loadBreaker: true,
    }
    // Settle over many τ; AVR has time to converge
    const { outputs } = advanceTime(inputs, 30 * PARAMS.tau)
    expect(outputs.vt).toBeCloseTo(1.0, 1) // ±0.05 pu tolerance
  })
})
