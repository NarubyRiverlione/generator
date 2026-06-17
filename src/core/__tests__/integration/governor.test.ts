/**
 * Governor tests — Phase 2 (Tasks 3.1–3.6)
 * Covers valve control, spin-up dynamics, speed/field independence
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, PARAMS, RELAY27_TRIP_VT, RPM_RATED, TAU_SPINUP, VALVE_RPM_MAX } from '../../constants'
import { computeLoad } from '../../load'
import { solveMachine } from '../../machine'
import { initialState } from '../../simulation'
import type { Inputs, SimState } from '../../types'
import { advanceTime, advanceWithState } from '../helpers'

// ── Relay-27 latch — core-level behavioral coverage ──────────────────────────
// The hook layer implements trip/latch/reset; these tests verify the underlying
// core conditions the hook depends on: trip trigger and effective load-zero state.

describe('relay-27 core conditions', () => {
  it('Vt falls below trip threshold when field drops to zero with load', () => {
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0.5, avrOn: false }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.vt).toBeLessThan(RELAY27_TRIP_VT)
  })

  it('forcing loadFraction = 0 (latch clamp) results in P ≈ 0 and Vt recovers', () => {
    // Simulate what the hook does when relay is latched: override loadFraction to 0
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.p).toBeCloseTo(0, 4)
    expect(outputs.vt).toBeGreaterThan(RELAY27_TRIP_VT)
  })

  it('after load returns to 0.5 post-reset, simulation resumes normal operation', () => {
    // Simulate post-reset: relay cleared, field healthy, load restored
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0.5, powerFactor: 0.85, pfLag: true, avrOn: false }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.collapsed).toBe(false)
    expect(outputs.vt).toBeGreaterThan(0.5)
    expect(outputs.p).toBeCloseTo(0.5, 1)
  })
})

// 3.1  Rated valve → 50 Hz / 1500 rpm; matches Phase 1 baseline Vₜ, P, Q
describe('3.1 rated valve matches Phase 1 baseline', () => {
  it('valve at ~93.75 % → 50 Hz / 1500 rpm and same Vt, P, Q as fixed-speed Phase 1', () => {
    // Seed with valve at rated position (1500 / 1600 × 100 = 93.75 %) and speed already at 1.0 pu
    const ratedValvePct = (RPM_RATED / VALVE_RPM_MAX) * 100
    const seeded: SimState = { ...initialState(), valvePct: ratedValvePct, speedLagged: 1.0 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0.5, powerFactor: 0.85, pfLag: true, avrOn: false, valveCommand: 0 }
    const { outputs } = advanceWithState(seeded, inputs, 10 * PARAMS.tau)
    expect(outputs.frequencyHz).toBeCloseTo(50, 2)
    expect(outputs.rpm).toBeCloseTo(1500, 0)
    // Compare against direct machine solve at speed=1.0 (Phase 1 reference)
    const load = computeLoad(0.5, 0.85, true)
    const ref = solveMachine(1.0, load.p, load.q, PARAMS.xs)
    expect(outputs.vt).toBeCloseTo(ref.vt, 2)
    expect(outputs.p).toBeCloseTo(ref.p, 2)
    expect(outputs.q).toBeCloseTo(ref.q, 2)
  })
})

// 3.2  Valve at partial opening → speed settles to corresponding RPM / Hz
describe('3.2 valve at 60 % → speed settles at 960 rpm / 32 Hz', () => {
  it('valve at 60 % after many τ_spinup → rpm ≈ 960 and frequencyHz ≈ 32', () => {
    // 60 % valve: rpmTarget = 0.6 × 1600 = 960 rpm; Hz = 960 / 30 = 32
    const seeded: SimState = { ...initialState(), valvePct: 60 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.2, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const { outputs } = advanceWithState(seeded, inputs, 10 * TAU_SPINUP)
    expect(outputs.rpm).toBeCloseTo(960, 0)
    expect(outputs.frequencyHz).toBeCloseTo(32, 1)
  })
})

// 3.3  Valve step → after 1 τ_spinup, lagged speed ~63 % toward new target
describe('3.3 spin-up lag: 63 % moved after 1 τ_spinup', () => {
  it('speedLagged moves ~63 % toward the full-open target (1600 rpm) after 2.5 s', () => {
    // Seed with valvePct = 100 and valveActual = 100 (actuator already settled) → rpmTarget = 1600
    const seeded: SimState = { ...initialState(), valvePct: 100, valveActual: 100, speedLagged: 1.0 }
    const speedTarget_pu = VALVE_RPM_MAX / RPM_RATED // = 1600/1500 ≈ 1.0667
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
    // rated: initial state (~93.44 % valve → ~0.997 pu speed)
    // low: valve at 75 % → rpmTarget = 1200, speed_pu = 0.8, Eₐ = 1.3 × 0.8 = 1.04 (above relay)
    const inputs_rated: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.3, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const seeded_low: SimState = { ...initialState(), valvePct: 75 }
    const inputs_low: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.3, loadFraction: 0, avrOn: false, valveCommand: 0 }

    const { outputs: out_rated } = advanceWithState(initialState(), inputs_rated, 10 * TAU_SPINUP)
    const { outputs: out_low } = advanceWithState(seeded_low, inputs_low, 10 * TAU_SPINUP)

    expect(out_low.vt).toBeLessThan(out_rated.vt)
    expect(out_low.vt).toBeGreaterThan(0.85) // above relay trip
  })
})

// 3.5  Spin-up lag and field lag are independent
describe('3.5 spin-up lag and field lag are independent', () => {
  it('speed and field each settle at their own τ without interference', () => {
    // Seed: valve at 100 % and actuator settled, speed still at 1.0; iField starting from 0
    const seeded: SimState = { ...initialState(), valvePct: 100, valveActual: 100, speedLagged: 1.0, iField: 0 }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.4, loadFraction: 0, avrOn: false, valveCommand: 0 }
    const speedTarget_pu = VALVE_RPM_MAX / RPM_RATED // = 1600/1500 ≈ 1.0667

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
