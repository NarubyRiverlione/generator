/**
 * AVR anti-windup tests (Task 4.7)
 * Covers command saturation and integral bounding
 */

import { describe, expect, it } from 'vitest'
import { AVR_COMMAND_MAX, AVR_COMMAND_MIN, PARAMS } from '../../constants'
import { stepAvr } from '../../avr'

describe('4.7 AVR anti-windup', () => {
  it('command never leaves [0.5, 1.7] under sustained large error', () => {
    // Call stepAvr directly with an extreme vref to force sustained saturation
    let integral = 0
    for (let i = 0; i < 1000; i++) {
      const r = stepAvr(10.0, 0.5, integral, PARAMS.kp, PARAMS.ki, 0.033)
      integral = r.integral
      expect(r.command).toBeLessThanOrEqual(AVR_COMMAND_MAX + 1e-9)
      expect(r.command).toBeGreaterThanOrEqual(AVR_COMMAND_MIN - 1e-9)
    }
  })

  it('integral remains bounded (no runaway) under sustained large error', () => {
    let integral = 0
    for (let i = 0; i < 3000; i++) {
      const r = stepAvr(10.0, 0.5, integral, PARAMS.kp, PARAMS.ki, 0.033)
      integral = r.integral
    }
    expect(Math.abs(integral)).toBeLessThan(100)
  })
})
