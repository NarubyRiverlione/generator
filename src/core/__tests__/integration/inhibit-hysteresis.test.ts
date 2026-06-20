/**
 * AVR and Governor inhibit hysteresis tests.
 * Covers arm/disarm transitions, inhibit gate, and hysteresis prevents disarm at arm threshold.
 */

import { describe, expect, it } from 'vitest'
import {
  DEFAULT_INPUTS,
  OMEGA_AVR_DISABLE,
  OMEGA_AVR_ENABLE,
  OMEGA_GOV_DISABLE,
  OMEGA_GOV_ENABLE,
  PARAMS,
} from '../../constants'
import { initialState, step } from '../../simulation'
import type { Inputs, SimState } from '../../types'
import { advanceWithState } from '../helpers'

function seedState(omega: number, overrides: Partial<SimState> = {}): SimState {
  return {
    ...initialState(),
    omega,
    valvePct: 0,
    valveActual: 0,
    collapsed: false,
    avrArmed: omega >= OMEGA_AVR_ENABLE,
    govArmed: omega >= OMEGA_GOV_ENABLE,
    ...overrides,
  }
}

// ── AVR arm hysteresis ────────────────────────────────────────────────────────

describe('AVR arm hysteresis', () => {
  it('avrArmed is false when omega is below OMEGA_AVR_ENABLE', () => {
    const state = seedState(OMEGA_AVR_ENABLE - 0.05)
    expect(state.avrArmed).toBe(false)
  })

  it('avrArmed becomes true after omega crosses OMEGA_AVR_ENABLE', () => {
    // Start just below, run one step with valve driving omega up
    const seeded: SimState = { ...seedState(OMEGA_AVR_ENABLE - 0.001), avrArmed: false }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    // Seed with enough valve to push omega slightly above threshold
    const aboveThreshold: SimState = { ...seeded, omega: OMEGA_AVR_ENABLE + 0.001 }
    const result = step(aboveThreshold, inputs, PARAMS, 0.01)
    expect(result.state.avrArmed).toBe(true)
    expect(result.outputs.avrArmed).toBe(true)
  })

  it('armed AVR stays armed when omega is between disarm and arm thresholds', () => {
    // Omega between OMEGA_AVR_DISABLE and OMEGA_AVR_ENABLE with avrArmed=true → stays armed
    const midOmega = (OMEGA_AVR_ENABLE + OMEGA_AVR_DISABLE) / 2
    const seeded: SimState = { ...seedState(midOmega), avrArmed: true }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const { state } = advanceWithState(seeded, inputs, 0.1)
    expect(state.avrArmed).toBe(true)
  })

  it('armed AVR disarms when omega drops below OMEGA_AVR_DISABLE', () => {
    const seeded: SimState = { ...seedState(OMEGA_AVR_DISABLE - 0.001), avrArmed: true }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const result = step(seeded, inputs, PARAMS, 0.01)
    expect(result.state.avrArmed).toBe(false)
    expect(result.outputs.avrArmed).toBe(false)
  })
})

// ── Governor arm hysteresis ───────────────────────────────────────────────────

describe('Governor arm hysteresis', () => {
  it('govArmed is false when omega is below OMEGA_GOV_ENABLE', () => {
    const state = seedState(OMEGA_GOV_ENABLE - 0.05)
    expect(state.govArmed).toBe(false)
  })

  it('govArmed becomes true after omega crosses OMEGA_GOV_ENABLE', () => {
    const seeded: SimState = { ...seedState(OMEGA_GOV_ENABLE + 0.001), govArmed: false }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const result = step(seeded, inputs, PARAMS, 0.01)
    expect(result.state.govArmed).toBe(true)
    expect(result.outputs.govArmed).toBe(true)
  })

  it('armed governor stays armed when omega is between disarm and arm thresholds', () => {
    const midOmega = (OMEGA_GOV_ENABLE + OMEGA_GOV_DISABLE) / 2
    const seeded: SimState = { ...seedState(midOmega), govArmed: true }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, governorOn: false, valveCommand: 0 }
    const { state } = advanceWithState(seeded, inputs, 0.1)
    expect(state.govArmed).toBe(true)
  })

  it('armed governor disarms when omega drops below OMEGA_GOV_DISABLE', () => {
    const seeded: SimState = { ...seedState(OMEGA_GOV_DISABLE - 0.001), govArmed: true }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, governorOn: false, valveCommand: 0 }
    const result = step(seeded, inputs, PARAMS, 0.01)
    expect(result.state.govArmed).toBe(false)
    expect(result.outputs.govArmed).toBe(false)
  })
})

// ── Governor inhibit gate ─────────────────────────────────────────────────────

describe('Governor inhibit gate', () => {
  it('governor PI does not run when govArmed=false, even with governorOn=true', () => {
    // With governorOn=true but govArmed=false, valve should follow jog (valveCommand=0 → hold)
    const seeded: SimState = { ...seedState(OMEGA_GOV_ENABLE - 0.1), govArmed: false, valvePct: 50, valveActual: 50 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, governorOn: true, valveCommand: 0 }
    const { state } = advanceWithState(seeded, inputs, 1)
    // Valve should stay at 50 (jog=0 means hold) not be slewed by PI
    expect(state.valvePct).toBeCloseTo(50, 2)
  })

  it('governor integral does not wind up beyond bumpless value when inhibited', () => {
    // With govArmed=false, bumpless transfer keeps integral consistent with current valve/speed
    const seeded: SimState = { ...seedState(0.5), govArmed: false, valvePct: 30, valveActual: 30 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, governorOn: true, valveCommand: 0 }
    const { state } = advanceWithState(seeded, inputs, 5)
    // Bumpless: integral = (valvePct - GOV_KP * error) / GOV_KI — should be finite, not runaway
    expect(Math.abs(state.governorIntegral)).toBeLessThan(1000)
  })
})

// ── AVR inhibit gate ──────────────────────────────────────────────────────────

describe('AVR inhibit gate', () => {
  it('field follows fieldVoltage input when avrArmed=false, even with avrOn=true', () => {
    const seeded: SimState = {
      ...seedState(OMEGA_AVR_ENABLE - 0.1),
      avrArmed: false,
      iField: 0,
      exciterLagged: 0,
    }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: true }
    // After settling, field should track fieldVoltage (1.0), not AVR output
    const { outputs } = advanceWithState(seeded, inputs, 5)
    expect(outputs.avrCommand).toBeCloseTo(1.0, 2)
  })
})

// ── Hysteresis boundary ───────────────────────────────────────────────────────

describe('Hysteresis prevents disarm at arm threshold', () => {
  it('avrArmed stays true when omega is exactly at OMEGA_AVR_ENABLE', () => {
    // Already armed, omega exactly at arm threshold — above disarm threshold → stays armed
    const seeded: SimState = { ...seedState(OMEGA_AVR_ENABLE), avrArmed: true }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const result = step(seeded, inputs, PARAMS, 0.01)
    expect(result.state.avrArmed).toBe(true)
  })

  it('govArmed stays true when omega is exactly at OMEGA_GOV_ENABLE', () => {
    const seeded: SimState = { ...seedState(OMEGA_GOV_ENABLE), govArmed: true }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, governorOn: false, valveCommand: 0 }
    const result = step(seeded, inputs, PARAMS, 0.01)
    expect(result.state.govArmed).toBe(true)
  })
})
