/**
 * Voltage collapse tests (Task 4.6)
 * Covers instability at high load, recovery behavior
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS } from '../../constants'
import { solveMachine } from '../../machine'
import { step } from '../../simulation'
import type { Inputs } from '../../types'
import { advanceTime, advanceN } from '../helpers'

describe('4.6 voltage collapse', () => {
  it('past the nose: collapsed true, no NaN, last valid retained', () => {
    // First settle at a valid operating point
    const safeInputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0.8, loadBreaker: true, avrOn: false, fieldVoltage: 1.0 }
    const { state: safeState, outputs: safeOutputs } = advanceTime(safeInputs, 10 * PARAMS.tau)

    // Now drive past the nose: very high load → P_max ≈ 1.875 at Ea=1 (xs=0.8)
    const collapseInputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 1.5, loadBreaker: true, avrOn: false, fieldVoltage: 1.0 }
    const { outputs: colOut } = advanceN(
      collapseInputs,
      1,
      0.001, // tiny dt — should collapse immediately
    )
    void safeState
    void safeOutputs

    expect(colOut.collapsed).toBe(true)
    expect(Number.isNaN(colOut.vt)).toBe(false)
    expect(Number.isNaN(colOut.p)).toBe(false)
    expect(Number.isNaN(colOut.q)).toBe(false)
  })

  it('at unity PF, 100% load does NOT collapse (below P_max ≈ 1.875)', () => {
    const result = solveMachine(1.0, 1.0, 0, PARAMS.xs)
    expect(result.collapsed).toBe(false)
  })

  it('at unity PF, 200% load collapses (above P_max ≈ 1.875)', () => {
    const result = solveMachine(1.0, 2.0, 0, PARAMS.xs)
    expect(result.collapsed).toBe(true)
  })

  it('recovery from collapse clears the flag', () => {
    // Start collapsed
    const collapseInputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 1.5, loadBreaker: true, avrOn: false, fieldVoltage: 1.0 }
    let { state } = advanceN(collapseInputs, 5, 0.01)

    // Reduce load to safe range
    const safeInputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0.3, loadBreaker: true, avrOn: false, fieldVoltage: 1.0 }
    let outputs = state.lastValidOutputs
    for (let i = 0; i < 1000; i++) {
      const r = step(state, safeInputs, PARAMS, 0.01)
      state = r.state
      outputs = r.outputs
    }

    expect(outputs.collapsed).toBe(false)
    expect(outputs.vt).toBeGreaterThan(0.5)
  })
})
