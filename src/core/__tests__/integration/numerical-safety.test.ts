/**
 * Numerical safety tests (Task 4.8)
 * Covers edge cases: zero-excitation, near-singular, sanitized inputs
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS } from '../../constants'
import { computeLoad } from '../../load'
import { solveMachine } from '../../machine'
import { initialState, step } from '../../simulation'
import type { Inputs } from '../../types'
import { advanceTime } from '../helpers'

describe('numerical safety: zero-excitation rest state', () => {
  it('zero field, zero load → finite outputs, not collapsed', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, avrOn: false }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.collapsed).toBe(false)
    expect(Number.isFinite(outputs.vt)).toBe(true)
    expect(Number.isFinite(outputs.ia)).toBe(true)
    expect(Number.isFinite(outputs.delta)).toBe(true)
    expect(outputs.vt).toBeCloseTo(0, 4)
    expect(outputs.ia).toBeCloseTo(0, 4)
    expect(outputs.delta).toBeCloseTo(0, 4)
  })

  it('iField in outputs tracks state after settling', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.2, loadFraction: 0, avrOn: false }
    const { outputs, state } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.iField).toBeCloseTo(state.iField, 6)
    expect(outputs.iField).toBeCloseTo(1.2, 2)
  })

  it('iField in outputs is distinct from avrCommand during transient when AVR is on', () => {
    // Start from iField=0 and step to AVR on — avrCommand jumps immediately, iField lags
    const inputs: Inputs = { ...DEFAULT_INPUTS, avrOn: true, loadFraction: 0 }
    const dt = 0.033
    const r = step(initialState(), inputs, PARAMS, dt)
    // After one tick avrCommand has updated but iField hasn't fully caught up from 0
    expect(r.outputs.iField).not.toBeCloseTo(r.outputs.avrCommand, 1)
  })
})

describe('numerical safety: near-singular loaded state', () => {
  it('near-zero Ea with non-zero load returns finite values', () => {
    const result = solveMachine(1e-10, 0.3, 0.2, PARAMS.xs)
    // Should be collapsed (no real Vt), but no NaN
    if (!result.collapsed) {
      expect(Number.isFinite(result.vt)).toBe(true)
      expect(Number.isFinite(result.ia)).toBe(true)
      expect(Number.isFinite(result.delta)).toBe(true)
    } else {
      expect(result.collapsed).toBe(true)
    }
  })

  it('solveMachine at zero Ea, zero load → finite rest state', () => {
    const result = solveMachine(0, 0, 0, PARAMS.xs)
    expect(result.collapsed).toBe(false)
    if (!result.collapsed) {
      expect(result.vt).toBeCloseTo(0, 6)
      expect(result.ia).toBeCloseTo(0, 6)
      expect(result.delta).toBeCloseTo(0, 6)
      expect(Number.isFinite(result.stabilityMargin)).toBe(true)
    }
  })
})

describe('numerical safety: sanitized load inputs', () => {
  it('NaN loadFraction is treated as 0', () => {
    const load = computeLoad(NaN, 0.85, true)
    expect(Number.isFinite(load.p)).toBe(true)
    expect(Number.isFinite(load.q)).toBe(true)
    expect(load.p).toBe(0)
  })

  it('negative loadFraction is clamped to 0', () => {
    const load = computeLoad(-0.5, 0.85, true)
    expect(load.p).toBe(0)
    expect(Number.isFinite(load.q)).toBe(true)
  })

  it('powerFactor > 1 is clamped to 1 (unity PF, Q = 0)', () => {
    const load = computeLoad(0.5, 1.5, true)
    expect(Number.isFinite(load.p)).toBe(true)
    expect(Number.isFinite(load.q)).toBe(true)
    expect(load.q).toBeCloseTo(0, 6)
  })

  it('NaN powerFactor defaults to 1 (unity PF)', () => {
    const load = computeLoad(0.5, NaN, true)
    expect(Number.isFinite(load.p)).toBe(true)
    expect(Number.isFinite(load.q)).toBe(true)
    expect(load.q).toBeCloseTo(0, 6)
  })
})
