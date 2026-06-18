/**
 * Diagnostic-output tests (#6)
 * Covers the saturation-derate and load-droop signals exported for the LCD readouts.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS, RPM_RATED } from '../../constants'
import { saturation } from '../../saturation'
import type { Inputs } from '../../types'
import { advanceTime } from '../helpers'

describe('saturation derate factor', () => {
  it('is 1.0 when field is below the knee', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: false, fieldVoltage: 0.8, loadFraction: 0.2 }
    const { outputs } = advanceTime(inputs, 30 * PARAMS.tau)
    expect(outputs.iField).toBeLessThanOrEqual(1.0)
    expect(outputs.saturationFactor).toBe(1.0)
  })

  it('falls below 1.0 above the knee and equals saturation(iField)/iField', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: false, fieldVoltage: 1.7, loadFraction: 0.2 }
    const { outputs } = advanceTime(inputs, 30 * PARAMS.tau)
    expect(outputs.iField).toBeGreaterThan(1.0)
    expect(outputs.saturationFactor).toBeLessThan(1.0)
    expect(outputs.saturationFactor).toBeCloseTo(saturation(outputs.iField) / outputs.iField, 6)
  })
})

describe('load-droop rpm', () => {
  it('is 0 at no load', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: false, fieldVoltage: 1.0, loadFraction: 0 }
    const { outputs } = advanceTime(inputs, 30 * PARAMS.tau)
    expect(outputs.droopRpm).toBeCloseTo(0, 6)
  })

  it('equals p · govDroop · RPM_RATED under load', () => {
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      avrOn: false,
      fieldVoltage: 1.0,
      loadFraction: 0.6,
      powerFactor: 1.0,
      pfLag: true,
    }
    const { outputs } = advanceTime(inputs, 30 * PARAMS.tau)
    expect(outputs.droopRpm).toBeGreaterThan(0)
    expect(outputs.droopRpm).toBeCloseTo(outputs.p * PARAMS.govDroop * RPM_RATED, 6)
  })
})
