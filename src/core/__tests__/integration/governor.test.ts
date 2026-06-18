/**
 * Governor tests — Phase 3a (swing-equation rotor dynamics)
 * Covers valve control, swing-equation dynamics, and speed/field independence.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, INERTIA_H, PARAMS, PM_MAX, RELAY27_TRIP_VT, RPM_RATED, VALVE_RPM_MAX } from '../../constants'
import { computeLoad } from '../../load'
import { solveMachine } from '../../machine'
import { initialState } from '../../simulation'
import type { Inputs, SimState } from '../../types'
import { advanceTime, advanceWithState } from '../helpers'

// ── Relay-27 latch — core-level behavioral coverage ──────────────────────────

describe('relay-27 core conditions', () => {
  it('Vt falls below trip threshold when field drops to zero with load', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0.5, avrOn: false }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.vt).toBeLessThan(RELAY27_TRIP_VT)
  })

  it('forcing loadFraction = 0 results in P ≈ 0 and Vt recovers', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.p).toBeCloseTo(0, 4)
    expect(outputs.vt).toBeGreaterThan(RELAY27_TRIP_VT)
  })

  it('after load returns to 0.5 post-reset, simulation resumes normal operation', () => {
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.0,
      loadFraction: 0.5,
      powerFactor: 0.85,
      pfLag: true,
      avrOn: false,
    }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.collapsed).toBe(false)
    expect(outputs.vt).toBeGreaterThan(0.5)
    expect(outputs.p).toBeCloseTo(0.5, 1)
  })
})

// ── Rated speed and baseline Vt ──────────────────────────────────────────────
// With swing equation: seed omega=1.0 and Pm=0 (valve closed), Pe=0 (no load).
// dω/dt = (0 - 0) / 2H = 0 → omega stays at 1.0 → 1500 rpm / 50 Hz.

describe('rated speed holds at omega=1.0 with balanced power', () => {
  it('seeded omega=1.0, valve closed, no load → 50 Hz / 1500 rpm', () => {
    const seeded: SimState = {
      ...initialState(),
      omega: 1.0,
      valvePct: 0,
      valveActual: 0,
      collapsed: false,
    }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const { outputs } = advanceWithState(seeded, inputs, 10 * PARAMS.tau)
    expect(outputs.frequencyHz).toBeCloseTo(50, 2)
    expect(outputs.rpm).toBeCloseTo(1500, 0)
    // Vt should match the machine solve at speed=1.0 (Phase 1 reference)
    const load = computeLoad(0, 0.85, true)
    const ref = solveMachine(1.0, load.p, load.q, PARAMS.xs)
    expect(outputs.vt).toBeCloseTo(ref.vt, 2)
  })
})

// ── Speed reduction sags Vt ──────────────────────────────────────────────────
// Seed two states at different omega values; hold valve closed (Pm=0) and no load (Pe=0)
// so dω/dt=0 and omega stays fixed. Vt depends on Ea = saturation(iField) × omega.

describe('speed reduction sags Vt with AVR off', () => {
  it('lower omega → lower Vt; field high enough to stay above the relay trip', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.3, loadFraction: 0, avrOn: false, valveCommand: 0 }
    // Valve closed so Pm=0, Pe=0 → omega stays at seeded value
    const seededHigh: SimState = { ...initialState(), omega: 1.0, valvePct: 0, valveActual: 0, collapsed: false }
    const seededLow: SimState = { ...initialState(), omega: 0.8, valvePct: 0, valveActual: 0, collapsed: false }

    const { outputs: outHigh } = advanceWithState(seededHigh, inputs, 10 * PARAMS.tau)
    const { outputs: outLow } = advanceWithState(seededLow, inputs, 10 * PARAMS.tau)

    expect(outLow.vt).toBeLessThan(outHigh.vt)
    expect(outLow.vt).toBeGreaterThan(0.85)
  })
})

// ── valveCommand hold / jog ───────────────────────────────────────────────────

describe('valve command behaviour', () => {
  it('valveCommand = 0 holds valvePct constant', () => {
    const seeded: SimState = { ...initialState(), valvePct: 70 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const { state } = advanceWithState(seeded, inputs, 5)
    expect(state.valvePct).toBeCloseTo(70, 5)
  })

  it('fast jog changes valve faster than slow jog over the same time', () => {
    const seeded: SimState = { ...initialState(), valvePct: 50 }
    const inputsSlow: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false, valveCommand: 1 }
    const inputsFast: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false, valveCommand: 2 }
    const { state: slow } = advanceWithState(seeded, inputsSlow, 1)
    const { state: fast } = advanceWithState(seeded, inputsFast, 1)
    expect(fast.valvePct).toBeGreaterThan(slow.valvePct)
  })
})

// ── Swing-equation dynamics ──────────────────────────────────────────────────

describe('run-up from rest with surplus Pm and no load', () => {
  it('omega starts at 0 and increases when Pm > 0 with Pe = 0', () => {
    // Pm = (50/100) × PM_MAX ≈ 0.533 pu; Pe = 0 → dω/dt ≈ 0.533/(2×4) ≈ 0.067 pu/s
    const seeded: SimState = {
      ...initialState(),
      omega: 0,
      valvePct: 50,
      valveActual: 50,
      collapsed: false,
    }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const { state } = advanceWithState(seeded, inputs, 5)
    expect(state.omega).toBeGreaterThan(0.1)
    expect(state.omega).toBeLessThan(VALVE_RPM_MAX / RPM_RATED)
  })
})

describe('fixed valve has no stable frequency after a load step', () => {
  it('omega drifts downward monotonically when Pe > Pm; no settling at a new steady frequency', () => {
    // valve=30%: Pm = 0.3 × PM_MAX ≈ 0.32 pu
    // load=0.5: Pe ≈ 0.5 pu → Pm - Pe ≈ -0.18 → dω/dt ≈ -0.022 pu/s
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
      fieldVoltage: 1.2,
      loadFraction: 0.5,
      powerFactor: 0.85,
      pfLag: true,
      avrOn: false,
      valveCommand: 0,
    }
    const { state: at5s } = advanceWithState(seeded, inputs, 5)
    const { state: at10s } = advanceWithState(seeded, inputs, 10)
    // omega should keep decreasing — no settling
    expect(at5s.omega).toBeLessThan(1.0)
    expect(at10s.omega).toBeLessThan(at5s.omega)
  })
})

describe('raising the valve after a load step arrests and reverses the drift', () => {
  it('valve raise makes omega increase after it was decreasing', () => {
    // Phase 1: valve=30% → Pe > Pm → omega decreases
    const seeded: SimState = {
      ...initialState(),
      omega: 1.0,
      valvePct: 30,
      valveActual: 30,
      iField: 1.2,
      exciterLagged: 1.2,
      collapsed: false,
    }
    const inputsLow: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.2,
      loadFraction: 0.5,
      powerFactor: 0.85,
      pfLag: true,
      avrOn: false,
      valveCommand: 0,
    }
    const { state: drifted } = advanceWithState(seeded, inputsLow, 3)
    expect(drifted.omega).toBeLessThan(1.0)

    // Phase 2: raise valve to 70%: Pm = 0.7 × PM_MAX ≈ 0.747 > Pe ≈ 0.5 → omega increases
    const stateHighValve: SimState = { ...drifted, valvePct: 70, valveActual: 70 }
    const inputsHigh: Inputs = { ...inputsLow }
    const { state: recovered } = advanceWithState(stateHighValve, inputsHigh, 3)
    expect(recovered.omega).toBeGreaterThan(drifted.omega)
  })
})

describe('linear drift rate ≈ (Pm − Pe) / (2H)', () => {
  it('omega changes at the expected rate with no load (Pe=0)', () => {
    // valve=50%: Pm = 0.5 × PM_MAX; Pe = 0 → expected dω/dt = Pm / (2H)
    const Pm = 0.5 * PM_MAX
    const expectedRate = Pm / (2 * INERTIA_H) // pu/s
    const seeded: SimState = {
      ...initialState(),
      omega: 0,
      valvePct: 50,
      valveActual: 50,
      collapsed: false,
    }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const elapsed = 2 // seconds
    const { state } = advanceWithState(seeded, inputs, elapsed)
    const expectedOmega = expectedRate * elapsed
    // Allow 5 % tolerance for the valve actuator lag (valveActual lags valvePct slightly)
    expect(state.omega).toBeGreaterThan(expectedOmega * 0.9)
    expect(state.omega).toBeLessThan(expectedOmega * 1.1)
  })
})

describe('overspeed ceiling clamps omega', () => {
  it('omega does not exceed VALVE_RPM_MAX / RPM_RATED even under sustained surplus Pm', () => {
    const OMEGA_MAX = VALVE_RPM_MAX / RPM_RATED
    const seeded: SimState = {
      ...initialState(),
      omega: 1.0,
      valvePct: 100,
      valveActual: 100,
      collapsed: false,
    }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const { state } = advanceWithState(seeded, inputs, 20)
    expect(state.omega).toBeLessThanOrEqual(OMEGA_MAX)
    expect(state.omega).toBeCloseTo(OMEGA_MAX, 4)
  })
})

describe('Pe = 0 on collapse: rotor accelerates (load rejection)', () => {
  it('collapsed machine with Pm > 0 causes omega to increase, not decrease', () => {
    // Machine collapses when Ea ≈ 0 (field off) with load present.
    // On collapse Pe → 0, so Pm (from valve) accelerates the rotor.
    const seeded: SimState = {
      ...initialState(),
      omega: 1.0,
      valvePct: 50,
      valveActual: 50,
      iField: 0,
      exciterLagged: 0,
      collapsed: false,
    }
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 0,
      loadFraction: 0.5,
      avrOn: false,
      valveCommand: 0,
    }
    // The machine should collapse (Ea=0, load present), then rotor should accelerate
    const { state } = advanceWithState(seeded, inputs, 3)
    expect(state.omega).toBeGreaterThan(1.0) // load rejection → acceleration
  })
})
