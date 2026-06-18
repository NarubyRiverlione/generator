/** Unit tests for the seeded initialState() signature. */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS, PM_MAX, RPM_RATED, VALVE_RPM_MAX } from '../../constants'
import { initialState, step } from '../../simulation'
import type { Inputs } from '../../types'

const VALVE_PCT_INIT = (1495 / VALVE_RPM_MAX) * 100
const SPEED_INIT_PU = 1495 / RPM_RATED

describe('initialState — no-seed reproduces prior default', () => {
  it('iField equals DEFAULT_INPUTS.fieldVoltage (zero)', () => {
    expect(initialState().iField).toBe(DEFAULT_INPUTS.fieldVoltage)
  })

  it('valvePct ≈ 93.44 % (1495 rpm default)', () => {
    expect(initialState().valvePct).toBeCloseTo(VALVE_PCT_INIT, 4)
  })

  it('valveActual ≈ 93.44 %', () => {
    expect(initialState().valveActual).toBeCloseTo(VALVE_PCT_INIT, 4)
  })

  it('omega ≈ 0.9967 pu', () => {
    expect(initialState().omega).toBeCloseTo(SPEED_INIT_PU, 4)
  })

  it('avrIntegral = 0', () => {
    expect(initialState().avrIntegral).toBe(0)
  })

  it('collapsed = false', () => {
    expect(initialState().collapsed).toBe(false)
  })
})

describe('initialState — partial seed overrides only named fields', () => {
  it('seeded iField and omega are applied; other laggeds derive from inputs', () => {
    const state = initialState(DEFAULT_INPUTS, { iField: 1.0, omega: 1.0 })
    expect(state.iField).toBe(1.0)
    expect(state.omega).toBe(1.0)
    // exciterLagged is not in seed → derives from DEFAULT_INPUTS.fieldVoltage = 0
    expect(state.exciterLagged).toBe(DEFAULT_INPUTS.fieldVoltage)
    // valvePct/valveActual are not in seed → defaults
    expect(state.valvePct).toBeCloseTo(VALVE_PCT_INIT, 4)
    expect(state.valveActual).toBeCloseTo(VALVE_PCT_INIT, 4)
  })

  it('seeded valveActual: 0 leaves omega at default when not explicitly seeded', () => {
    const state = initialState(DEFAULT_INPUTS, { valveActual: 0, valvePct: 0, omega: 0 })
    expect(state.valveActual).toBe(0)
    expect(state.valvePct).toBe(0)
    expect(state.omega).toBe(0)
    // iField still derives from DEFAULT_INPUTS
    expect(state.iField).toBe(DEFAULT_INPUTS.fieldVoltage)
  })
})

describe('initialState — lastValidOutputs is coherent with the seed', () => {
  it('warm seed: vt > 0 on first frame (no cold needle-snap)', () => {
    const warmInputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.1 }
    const state = initialState(warmInputs, { iField: 1.1, omega: SPEED_INIT_PU })
    expect(state.lastValidOutputs.vt).toBeGreaterThan(0.5)
    expect(state.lastValidOutputs.rpm).toBeCloseTo(SPEED_INIT_PU * RPM_RATED, 0)
  })

  it('cold-dark seed: vt = 0 and rpm = 0', () => {
    const state = initialState(DEFAULT_INPUTS, { iField: 0, omega: 0, valveActual: 0, valvePct: 0 })
    expect(state.lastValidOutputs.vt).toBe(0)
    expect(state.lastValidOutputs.rpm).toBe(0)
  })

  it('lastValidOutputs.pm reflects seeded valve position', () => {
    const state = initialState(DEFAULT_INPUTS, { valveActual: 50 })
    expect(state.lastValidOutputs.pm).toBeCloseTo((50 / 100) * PM_MAX, 6)
  })
})

describe('initialState — collapsed seed produces coherent zero-output frame', () => {
  it('seeding Ea=0 with non-zero load yields collapsed=false with zeroed Vt/Ia and finite pm', () => {
    // Ea=0 (iField=0, omega=0) + load → solveMachine collapses → collapsed branch in initialState
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0.5 }
    const state = initialState(inputs, { iField: 0, omega: 0, valveActual: 0, valvePct: 0 })
    expect(state.lastValidOutputs.vt).toBe(0)
    expect(state.lastValidOutputs.ia).toBe(0)
    expect(state.lastValidOutputs.collapsed).toBe(false) // lastValidOutputs is always non-collapsed
    expect(state.lastValidOutputs.pm).toBeCloseTo(0, 6) // valve closed
    expect(state.collapsed).toBe(false) // initialState starts non-collapsed
  })
})

describe('initialState — seeded state evolves identically to settled state under step()', () => {
  it('advancing seeded and naturally-settled states from the same point produces the same next outputs', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false }
    const settled = initialState(inputs)
    const seeded = initialState(inputs, {
      iField: settled.iField,
      exciterLagged: settled.exciterLagged,
      omega: settled.omega,
      valvePct: settled.valvePct,
      valveActual: settled.valveActual,
      avrIntegral: settled.avrIntegral,
    })
    const dt = 0.033
    const { outputs: outSettled } = step(settled, inputs, PARAMS, dt)
    const { outputs: outSeeded } = step(seeded, inputs, PARAMS, dt)
    expect(outSeeded.vt).toBeCloseTo(outSettled.vt, 6)
    expect(outSeeded.rpm).toBeCloseTo(outSettled.rpm, 6)
    expect(outSeeded.p).toBeCloseTo(outSettled.p, 6)
  })
})
