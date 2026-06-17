/** Tests for unit conversion functions */

import { describe, expect, it } from 'vitest'
import {
  fieldToExciterAC,
  fieldToFieldCurrent,
  fieldToRectifiedDC,
  puToAmps,
  puToKVAR,
  puToKW,
  puToVolts,
} from '../../units'

describe('unit conversions', () => {
  it('puToVolts: 1.0 pu = 400 V', () => {
    expect(puToVolts(1.0)).toBeCloseTo(400)
    expect(puToVolts(0)).toBe(0)
  })

  it('puToKW: 1.0 pu = 1000 kW', () => {
    expect(puToKW(1.0)).toBeCloseTo(1000)
  })

  it('puToKVAR: 1.0 pu = 1000 kVAR', () => {
    expect(puToKVAR(1.0)).toBeCloseTo(1000)
  })

  it('puToAmps: reasonable value for 1 MVA / 400 V', () => {
    const iBase = 1_000_000 / (Math.sqrt(3) * 400)
    expect(puToAmps(1.0)).toBeCloseTo(iBase, 0)
  })

  it('exciter chain readouts move together', () => {
    const field = 0.8
    const ac = fieldToExciterAC(field)
    const dc = fieldToRectifiedDC(field)
    const iField = fieldToFieldCurrent(field)
    expect(ac).toBeGreaterThan(0)
    expect(dc).toBeGreaterThan(0)
    expect(iField).toBeGreaterThan(0)
    // DC is less than AC (rectifier ratio < 1)
    expect(dc).toBeLessThan(ac)
  })
})
