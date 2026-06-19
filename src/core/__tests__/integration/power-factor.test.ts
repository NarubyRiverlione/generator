/**
 * Power factor sign tests (Task 4.5)
 * Covers lagging/leading PF and reactive power flow
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS } from '../../constants'
import { computeLoad } from '../../load'
import type { Inputs } from '../../types'
import { advanceTime } from '../helpers'

describe('4.5 power factor sign', () => {
  it('lagging PF → Q > 0 (generator supplying reactive)', () => {
    const load = computeLoad(0.5, 0.85, true)
    expect(load.q).toBeGreaterThan(0)
  })

  it('leading PF → Q < 0 (generator absorbing reactive)', () => {
    const load = computeLoad(0.5, 0.85, false)
    expect(load.q).toBeLessThan(0)
  })

  it('lagging load Q > 0 flows through to outputs', () => {
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.0,
      pfLag: true,
      powerFactor: 0.85,
      loadFraction: 0.5,
      loadBreaker: true,
      avrOn: false,
    }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.q).toBeGreaterThan(0)
  })

  it('leading load Q < 0 flows through to outputs', () => {
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.0,
      pfLag: false,
      powerFactor: 0.85,
      loadFraction: 0.5,
      loadBreaker: true,
      avrOn: false,
    }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.q).toBeLessThan(0)
  })
})
