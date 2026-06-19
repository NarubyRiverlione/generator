/**
 * Diagnostic-output tests
 * Covers the saturation-derate signal and mechanical-power (pm) exported for the LCD readouts.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS, PM_MAX } from '../../constants'
import { saturation } from '../../saturation'
import { initialState } from '../../simulation'
import type { Inputs, SimState } from '../../types'
import { advanceTime, advanceWithState } from '../helpers'

describe('saturation derate factor', () => {
  it('is 1.0 when field is below the knee', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: false, fieldVoltage: 0.8, loadFraction: 0.2, loadBreaker: true }
    const { outputs } = advanceTime(inputs, 30 * PARAMS.tau)
    expect(outputs.iField).toBeLessThanOrEqual(1.0)
    expect(outputs.saturationFactor).toBe(1.0)
  })

  it('falls below 1.0 above the knee and equals saturation(iField)/iField', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: false, fieldVoltage: 1.7, loadFraction: 0.2, loadBreaker: true }
    const { outputs } = advanceTime(inputs, 30 * PARAMS.tau)
    expect(outputs.iField).toBeGreaterThan(1.0)
    expect(outputs.saturationFactor).toBeLessThan(1.0)
    expect(outputs.saturationFactor).toBeCloseTo(saturation(outputs.iField) / outputs.iField, 6)
  })
})

describe('mechanical power output (pm)', () => {
  it('pm is 0 when valve is closed', () => {
    const seeded: SimState = { ...initialState(), valvePct: 0, valveActual: 0, collapsed: false }
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: false, fieldVoltage: 0, loadFraction: 0 }
    const { outputs } = advanceWithState(seeded, inputs, 1)
    expect(outputs.pm).toBeCloseTo(0, 6)
  })

  it('pm ≈ 1.0 at the rated valve position', () => {
    // Rated position: valveActual = RPM_RATED / VALVE_RPM_MAX × 100 = 93.75 %
    // After the actuator lag settles: pm = (93.75/100) × PM_MAX = 1.0
    const seeded: SimState = {
      ...initialState(),
      valvePct: 93.75,
      valveActual: 93.75,
      collapsed: false,
    }
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: false, fieldVoltage: 0, loadFraction: 0 }
    // No lag to wait for since valveActual is already seeded at rated position
    const { outputs } = advanceWithState(seeded, inputs, 0.1)
    expect(outputs.pm).toBeCloseTo(1.0, 2)
  })

  it('pm equals (valveActual/100) × PM_MAX', () => {
    const seeded: SimState = { ...initialState(), valvePct: 60, valveActual: 60, collapsed: false }
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: false, fieldVoltage: 0, loadFraction: 0 }
    const { outputs } = advanceWithState(seeded, inputs, 0.1)
    // valveActual will be very close to 60 after only 0.1 s
    expect(outputs.pm).toBeCloseTo((outputs.valveActual / 100) * PM_MAX, 6)
  })

  it('power balance pm − p is negative when load exceeds mechanical input', () => {
    // valve=30%: Pm ≈ 0.32; load=0.5: Pe ≈ 0.5 → imbalance ≈ -0.18
    const seeded: SimState = {
      ...initialState(),
      omega: 1.0,
      valvePct: 30,
      valveActual: 30,
      iField: 1.2,
      exciterLagged: 1.2,
      collapsed: false,
    }
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      avrOn: false,
      fieldVoltage: 1.2,
      loadFraction: 0.5,
      powerFactor: 0.85,
      pfLag: true,
      loadBreaker: true,
    }
    const { outputs } = advanceWithState(seeded, inputs, 1)
    expect(outputs.pm - outputs.p).toBeLessThan(0)
  })
})
