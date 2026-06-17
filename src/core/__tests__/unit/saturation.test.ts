/** Saturation curve unit tests (Tasks 1.3–1.5) */

import { describe, expect, it } from 'vitest'
import { saturation } from '../../saturation'

describe('saturation curve', () => {
  it('1.3 knee point is exact: field = 1.0 → 1.0', () => {
    expect(saturation(1.0)).toBeCloseTo(1.0, 10)
  })

  it('1.4 ceiling: field = 1.5 → 1.2', () => {
    expect(saturation(1.5)).toBeCloseTo(1.2, 10)
  })

  it('1.5 linear interpolation above knee: field = 1.25 → 1.1', () => {
    expect(saturation(1.25)).toBeCloseTo(1.1, 10)
  })

  it('below knee is linear: field = 0.5 → 0.5', () => {
    expect(saturation(0.5)).toBeCloseTo(0.5, 10)
  })

  it('zero field → zero EMF', () => {
    expect(saturation(0)).toBeCloseTo(0, 10)
  })
})
