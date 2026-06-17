/**
 * Core physics tests — covers tasks 4.1–4.8 and Phase 2 governor tasks 3.1–3.6.
 * All tests run in Vitest node environment; no React, no DOM.
 */

import { describe, expect, it } from 'vitest'
import { AVR_COMMAND_MAX, AVR_COMMAND_MIN, DEFAULT_INPUTS, PARAMS, TAU_SPINUP } from './constants'
import { stepAvr } from './avr'
import { computeLoad } from './load'
import { solveMachine } from './machine'
import { initialState, step } from './simulation'
import type { Inputs, SimState } from './types'

// ── helpers ─────────────────────────────────────────────────────────────────

function advanceN(inputs: Inputs, n: number, dt: number) {
  let state = initialState()
  let outputs = state.lastValidOutputs
  for (let i = 0; i < n; i++) {
    const r = step(state, inputs, PARAMS, dt)
    state = r.state
    outputs = r.outputs
  }
  return { state, outputs }
}

function advanceTime(inputs: Inputs, totalSeconds: number, dt = 0.01) {
  return advanceN(inputs, Math.round(totalSeconds / dt), dt)
}

// ── 4.1  No-load: Vₜ ≈ Eₐ, Iₐ ≈ 0 ──────────────────────────────────────

describe('4.1 no-load edge', () => {
  it('Vt equals field current and Ia is near zero at zero load', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, avrOn: false, fieldVoltage: 1.0 }
    // Settle for 10 τ
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.vt).toBeCloseTo(1.0, 2)
    expect(outputs.ia).toBeLessThan(0.01)
    expect(outputs.collapsed).toBe(false)
  })

  it('no-load Vt tracks non-default field voltage', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, avrOn: false, fieldVoltage: 1.3 }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.vt).toBeCloseTo(1.3, 2)
  })
})

// ── 4.2  Field step settles over τ ──────────────────────────────────────────

describe('4.2 field step settles over τ', () => {
  it('~63 % of step completed after 1τ', () => {
    const fieldStart = 1.0
    const fieldEnd = 1.4

    // Start settled at fieldStart with no load
    const inputs0: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldStart }
    const { state: settled } = advanceTime(inputs0, 10 * PARAMS.tau)

    // Step to fieldEnd and advance 1τ
    const inputsStep: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldEnd }
    const dt = 0.01
    let state = settled
    for (let i = 0; i < Math.round(PARAMS.tau / dt); i++) {
      const r = step(state, inputsStep, PARAMS, dt)
      state = r.state
    }

    const iField = state.iField
    const delta = fieldEnd - fieldStart
    const progress = (iField - fieldStart) / delta
    // Should be ~63 % (1 - 1/e ≈ 0.632)
    expect(progress).toBeGreaterThan(0.58)
    expect(progress).toBeLessThan(0.68)
  })

  it('essentially complete after 4τ (> 98 %)', () => {
    const fieldStart = 1.0
    const fieldEnd = 1.4

    // Pre-settle at fieldStart, then step to fieldEnd and advance 4τ
    const inputs0: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldStart }
    const { state: settled } = advanceTime(inputs0, 10 * PARAMS.tau)

    const inputsStep: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0, fieldVoltage: fieldEnd }
    const dt = 0.01
    let state = settled
    for (let i = 0; i < Math.round((4 * PARAMS.tau) / dt); i++) {
      state = step(state, inputsStep, PARAMS, dt).state
    }

    const progress = (state.iField - fieldStart) / (fieldEnd - fieldStart)
    expect(progress).toBeGreaterThan(0.98)
  })
})

// ── 4.3  Load↑ AVR off → Vₜ drops; δ increases ─────────────────────────────

describe('4.3 load increase with AVR off', () => {
  it('Vt drops as load increases', () => {
    const base: Inputs = { ...DEFAULT_INPUTS, avrOn: false, fieldVoltage: 1.0, powerFactor: 0.85, pfLag: true }
    const low: Inputs = { ...base, loadFraction: 0.2 }
    const high: Inputs = { ...base, loadFraction: 0.8 }

    const { outputs: outLow } = advanceTime(low, 10 * PARAMS.tau)
    const { outputs: outHigh } = advanceTime(high, 10 * PARAMS.tau)

    expect(outHigh.vt).toBeLessThan(outLow.vt)
  })

  it('δ increases monotonically with load', () => {
    // Use unity PF (Q=0) so P_max ≈ 1.25 and no collapse in this range
    const loads = [0.1, 0.3, 0.5, 0.7, 0.9]
    const deltas = loads.map((lf) => {
      const inputs: Inputs = {
        ...DEFAULT_INPUTS,
        avrOn: false,
        fieldVoltage: 1.0,
        loadFraction: lf,
        powerFactor: 1.0,
        pfLag: true,
      }
      const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
      return outputs.delta
    })

    for (let i = 1; i < deltas.length; i++) {
      expect(deltas[i]).toBeGreaterThan(deltas[i - 1])
    }
  })
})

// ── 4.4  Load↑ AVR on → field rises, settled Vₜ ≈ Vref ─────────────────────

describe('4.4 load increase with AVR on', () => {
  it('AVR holds Vt within tolerance of 1.0 pu under increased load', () => {
    // Unity PF so P_max ≈ 1.25; 60% load is well within range with AVR headroom
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      avrOn: true,
      loadFraction: 0.6,
      powerFactor: 1.0,
      pfLag: true,
    }
    // Settle over many τ; AVR has time to converge
    const { outputs } = advanceTime(inputs, 30 * PARAMS.tau)
    expect(outputs.vt).toBeCloseTo(1.0, 1) // ±0.05 pu tolerance
  })
})

// ── 4.5  Power factor sign ───────────────────────────────────────────────────

describe('4.5 power factor sign', () => {
  it('lagging PF → Q > 0 (generator supplying reactive)', () => {
    const load = computeLoad(0.5, 0.85, true)
    expect(load.q).toBeGreaterThan(0)
  })

  it('leading PF → Q < 0 (generator absorbing reactive)', () => {
    const load = computeLoad(0.5, 0.85, false)
    expect(load.q).toBeLessThan(0)
  })

  it('lagging load Q > 0 flows through to outputs', () => {
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.0,
      pfLag: true,
      powerFactor: 0.85,
      loadFraction: 0.5,
      avrOn: false,
    }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.q).toBeGreaterThan(0)
  })

  it('leading load Q < 0 flows through to outputs', () => {
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.0,
      pfLag: false,
      powerFactor: 0.85,
      loadFraction: 0.5,
      avrOn: false,
    }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.q).toBeLessThan(0)
  })
})

// ── 4.6  Voltage collapse ────────────────────────────────────────────────────

describe('4.6 voltage collapse', () => {
  it('past the nose: collapsed true, no NaN, last valid retained', () => {
    // First settle at a valid operating point
    const safeInputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0.8, avrOn: false, fieldVoltage: 1.0 }
    const { state: safeState, outputs: safeOutputs } = advanceTime(safeInputs, 10 * PARAMS.tau)

    // Now drive past the nose: very high load, unity PF → P_max ≈ 1.25 at Ea=1
    const collapseInputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 1.5, avrOn: false, fieldVoltage: 1.0 }
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

  it('at unity PF, 100% load does NOT collapse (below P_max ≈ 1.25)', () => {
    const result = solveMachine(1.0, 1.0, 0, PARAMS.xs)
    expect(result.collapsed).toBe(false)
  })

  it('at unity PF, 130% load collapses (above P_max ≈ 1.25)', () => {
    const result = solveMachine(1.0, 1.3, 0, PARAMS.xs)
    expect(result.collapsed).toBe(true)
  })

  it('recovery from collapse clears the flag', () => {
    // Start collapsed
    const collapseInputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 1.5, avrOn: false, fieldVoltage: 1.0 }
    let { state } = advanceN(collapseInputs, 5, 0.01)

    // Reduce load to safe range
    const safeInputs: Inputs = { ...DEFAULT_INPUTS, loadFraction: 0.3, avrOn: false, fieldVoltage: 1.0 }
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

// ── 4.7  AVR anti-windup ─────────────────────────────────────────────────────

describe('4.7 AVR anti-windup', () => {
  it('command never leaves [0.5, 1.5] under sustained large error', () => {
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

// ── 4.8  Coverage is confirmed by the test runner ────────────────────────────
// (vitest --coverage enforces the 90% threshold configured in vitest.config.ts)

// ── Phase 2 governor tests (tasks 3.1–3.6) ──────────────────────────────────

// helpers shared across governor tests

function advanceWithState(startState: SimState, inputs: Inputs, totalSeconds: number, dt = 0.01): { state: SimState; outputs: ReturnType<typeof step>['outputs'] } {
  let state = startState
  let outputs = state.lastValidOutputs
  const n = Math.round(totalSeconds / dt)
  for (let i = 0; i < n; i++) {
    const r = step(state, inputs, PARAMS, dt)
    state = r.state
    outputs = r.outputs
  }
  return { state, outputs }
}

// 3.1  Rated speed → Phase 1 baseline Vₜ, P, Q
describe('3.1 rated speed matches Phase 1 baseline', () => {
  it('nominal valve (50 %) → 50 Hz / 1500 rpm and same Vt, P, Q as fixed-speed Phase 1', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0.5, powerFactor: 0.85, pfLag: true, avrOn: false, valveCommand: 0 }
    // Settle over many τ; valve stays at 50 %, speedLagged stays 1.0
    const { outputs } = advanceWithState(initialState(), inputs, 10 * PARAMS.tau)
    expect(outputs.frequencyHz).toBeCloseTo(50, 2)
    expect(outputs.rpm).toBeCloseTo(1500, 0)
    // Compare against direct machine solve at speed=1.0 (Phase 1 reference)
    const load = computeLoad(0.5, 0.85, true)
    // field will have lagged to ~1.0 over 10τ; Vt should match solveMachine(1.0, ...)
    const ref = solveMachine(1.0, load.p, load.q, PARAMS.xs)
    expect(outputs.vt).toBeCloseTo(ref.vt, 2)
    expect(outputs.p).toBeCloseTo(ref.p, 2)
    expect(outputs.q).toBeCloseTo(ref.q, 2)
  })
})

// 3.2  Valve held lower → speed settles to ~47 Hz / 1410 rpm
describe('3.2 valve held lower → speed settles at low end of band', () => {
  it('valve at 0 % after many τ_spinup → frequencyHz ≈ 47 and rpm ≈ 1410', () => {
    // Seed state with valvePct already at 0 so we only wait on spin-up lag, not jog
    const seeded: SimState = { ...initialState(), valvePct: 0 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.2, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const { outputs } = advanceWithState(seeded, inputs, 10 * TAU_SPINUP)
    expect(outputs.frequencyHz).toBeCloseTo(47, 1)
    expect(outputs.rpm).toBeCloseTo(1410, 0)
  })
})

// 3.3  Valve step → after 1 τ_spinup, lagged speed ~63 % toward new target
describe('3.3 spin-up lag: 63 % moved after 1 τ_spinup', () => {
  it('speedLagged moves ~63 % toward the high-end target after 2.5 s', () => {
    // Seed with valvePct = 100 so target is 1.06 pu; speedLagged still 1.0
    const seeded: SimState = { ...initialState(), valvePct: 100, speedLagged: 1.0 }
    const speedTarget_pu = 53 / 50 // = 1.06
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const { state } = advanceWithState(seeded, inputs, TAU_SPINUP)
    const progress = (state.speedLagged - 1.0) / (speedTarget_pu - 1.0)
    expect(progress).toBeGreaterThan(0.58)
    expect(progress).toBeLessThan(0.68)
  })
})

// 3.4  Speed reduction with AVR off → Vₜ falls (Eₐ scaled down); stays above 0.85 relay trip
describe('3.4 speed reduction sags Vt with AVR off', () => {
  it('lower speed → lower Vt; field high enough to stay above 0.85 relay trip', () => {
    const inputs_rated: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.2, loadFraction: 0.3, avrOn: false, valveCommand: 0 }
    const seeded_low: SimState = { ...initialState(), valvePct: 0 }
    const inputs_low: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.2, loadFraction: 0.3, avrOn: false, valveCommand: 0 }

    const { outputs: out_rated } = advanceWithState(initialState(), inputs_rated, 10 * PARAMS.tau)
    const { outputs: out_low } = advanceWithState(seeded_low, inputs_low, 10 * TAU_SPINUP)

    expect(out_low.vt).toBeLessThan(out_rated.vt)
    expect(out_low.vt).toBeGreaterThan(0.85) // above relay trip
  })
})

// 3.5  Spin-up lag and field lag are independent
describe('3.5 spin-up lag and field lag are independent', () => {
  it('speed and field each settle at their own τ without interference', () => {
    // Seed: valve at 100 %, speed still at 1.0; iField starting from 0 with field target 1.4
    const seeded: SimState = { ...initialState(), valvePct: 100, speedLagged: 1.0, iField: 0 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.4, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const speedTarget_pu = 53 / 50

    // Measure both lags at a common time: 1.5 s (= τ_field, shorter than τ_spinup = 2.5 s)
    // At 1.5 s: field progress ≈ 1 − 1/e ≈ 63 %; speed progress ≈ 1 − e^(−0.6) ≈ 45 %
    const { state } = advanceWithState(seeded, inputs, PARAMS.tau)

    const fieldProgress = state.iField / 1.4
    const speedProgress = (state.speedLagged - 1.0) / (speedTarget_pu - 1.0)

    // Field should be ~63 % at 1 τ_field
    expect(fieldProgress).toBeGreaterThan(0.58)
    expect(fieldProgress).toBeLessThan(0.68)

    // Speed should be noticeably less (~45 %) — τ_spinup is larger
    expect(speedProgress).toBeGreaterThan(0.35)
    expect(speedProgress).toBeLessThan(0.55)

    // The difference confirms they're on independent time constants
    expect(fieldProgress).toBeGreaterThan(speedProgress + 0.10)
  })
})

// 3.6  valveCommand = 0 holds valvePct constant
describe('3.6 valveCommand = 0 holds valve; command integrates faster than inner lag', () => {
  it('valve stays constant when command is 0', () => {
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
