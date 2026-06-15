/** Tests for complex arithmetic and unit conversions. */

import { describe, expect, it } from 'vitest'
import { abs, add, arg, cx, div, mul, sub } from './complex'
import { fieldToExciterAC, fieldToFieldCurrent, fieldToRectifiedDC, puToAmps, puToKVAR, puToKW, puToVolts } from './units'

describe('complex arithmetic', () => {
  it('add', () => {
    const r = add(cx(1, 2), cx(3, 4))
    expect(r.re).toBeCloseTo(4)
    expect(r.im).toBeCloseTo(6)
  })

  it('sub', () => {
    const r = sub(cx(5, 3), cx(2, 1))
    expect(r.re).toBeCloseTo(3)
    expect(r.im).toBeCloseTo(2)
  })

  it('mul', () => {
    // (1+2i)(3+4i) = 3+4i+6i+8i² = 3-8+10i = -5+10i
    const r = mul(cx(1, 2), cx(3, 4))
    expect(r.re).toBeCloseTo(-5)
    expect(r.im).toBeCloseTo(10)
  })

  it('div', () => {
    // (1+2i)/(1+0i) = 1+2i
    const r = div(cx(1, 2), cx(1, 0))
    expect(r.re).toBeCloseTo(1)
    expect(r.im).toBeCloseTo(2)
  })

  it('abs', () => {
    expect(abs(cx(3, 4))).toBeCloseTo(5)
    expect(abs(cx(0, 0))).toBeCloseTo(0)
  })

  it('arg', () => {
    expect(arg(cx(1, 0))).toBeCloseTo(0)
    expect(arg(cx(0, 1))).toBeCloseTo(Math.PI / 2)
    expect(arg(cx(-1, 0))).toBeCloseTo(Math.PI)
  })
})

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
