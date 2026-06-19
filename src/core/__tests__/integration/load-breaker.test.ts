/**
 * Load breaker tests — Stage 3d
 * Covers breaker gating, instantaneous load step, dampingTorque, and TAU_VALVE.
 */

import { describe, expect, it } from 'vitest'
import { DAMPING_D, DEFAULT_INPUTS, OMEGA_REF, PARAMS } from '../../constants'
import { initialState, step } from '../../simulation'
import type { Inputs, SimState } from '../../types'
import { advanceTime, advanceWithState } from '../helpers'

// ── Breaker gating ────────────────────────────────────────────────────────────

describe('load breaker open — load disconnected', () => {
  it('open breaker: Pe = 0 regardless of load Knob; Vt settles to Ea', () => {
    // Breaker open — load Knob at 60%, but Pe should be zero.
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.0,
      loadFraction: 0.6,
      loadBreaker: false,
      avrOn: false,
    }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.p).toBeCloseTo(0, 4)
    // Vt should equal Ea (no-load) ≈ field_settled × omega — close to 1.0 at rated speed
    expect(outputs.vt).toBeGreaterThan(0.95)
  })

  it('open breaker: Q = 0 regardless of power factor Knob', () => {
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.0,
      loadFraction: 0.5,
      loadBreaker: false,
      powerFactor: 0.85,
      pfLag: true,
      avrOn: false,
    }
    const { outputs } = advanceTime(inputs, 10 * PARAMS.tau)
    expect(outputs.q).toBeCloseTo(0, 4)
  })
})

describe('load breaker close — instantaneous load step', () => {
  it('closing breaker applies full load in the next step (no ramp)', () => {
    // Settle open-breaker at rated speed
    const openInputs: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.2,
      loadFraction: 0.5,
      loadBreaker: false,
      avrOn: false,
    }
    const seeded: SimState = {
      ...initialState(),
      omega: 1.0,
      valvePct: 46.875,
      valveActual: 46.875,
      iField: 1.2,
      exciterLagged: 1.2,
      collapsed: false,
    }
    // One step with open breaker
    const { state: openState, outputs: openOut } = advanceWithState(seeded, openInputs, 0.033)
    expect(openOut.p).toBeCloseTo(0, 3)

    // One step with closed breaker — load should jump
    const closedInputs: Inputs = { ...openInputs, loadBreaker: true }
    const { outputs: closedOut } = advanceWithState(openState, closedInputs, 0.033)
    expect(closedOut.p).toBeGreaterThan(0.1) // substantial Pe immediately
  })

  it('Pe transitions from 0 to full value in one step', () => {
    const openInputs: Inputs = {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.2,
      loadFraction: 0.5,
      loadBreaker: false,
      powerFactor: 0.85,
      pfLag: true,
      avrOn: false,
    }
    const seeded: SimState = {
      ...initialState(),
      omega: 1.0,
      valvePct: 46.875,
      valveActual: 46.875,
      iField: 1.2,
      exciterLagged: 1.2,
      collapsed: false,
    }
    const { state: beforeClose } = advanceWithState(seeded, openInputs, 0.033)

    // Close: Pe should be non-zero immediately, not ramping
    const closedInputs: Inputs = { ...openInputs, loadBreaker: true }
    const { outputs: closedOut } = step(beforeClose, closedInputs, PARAMS, 0.033)
    expect(closedOut.p).toBeGreaterThan(0.05)
  })
})

// ── Damping torque ────────────────────────────────────────────────────────────

describe('dampingTorque output', () => {
  it('is ~0 at synchronous speed (valve closed, no load — omega barely moves)', () => {
    // valve=0 → Pm=0, load open → Pe=0; dω/dt = 0 → omega stays at 1.0 → dampingTorque ≈ 0
    const seeded: SimState = {
      ...initialState(),
      omega: OMEGA_REF,
      valvePct: 0,
      valveActual: 0,
      iField: 1.0,
      exciterLagged: 1.0,
      collapsed: false,
    }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false }
    const { outputs } = step(seeded, inputs, PARAMS, 0.033)
    expect(outputs.dampingTorque).toBeCloseTo(0, 4)
  })

  it('is proportional to slip: dampingTorque = D·(omega_new − ωref)', () => {
    // Use valve=0, no load so Pm=0, Pe=0.
    // dω/dt = (0 − 0 − D·slip) / 2H → omega changes only by the damping correction over one step.
    // Check that dampingTorque = D * (post-step omega − OMEGA_REF).
    const slip = -0.05
    const seeded: SimState = {
      ...initialState(),
      omega: OMEGA_REF + slip,
      valvePct: 0,
      valveActual: 0,
      iField: 1.0,
      exciterLagged: 1.0,
      collapsed: false,
    }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 1.0, loadFraction: 0, avrOn: false }
    const { outputs } = step(seeded, inputs, PARAMS, 0.033)
    // dampingTorque must equal D * (the omega that was actually used in this step)
    expect(outputs.dampingTorque).toBeCloseTo(DAMPING_D * (outputs.rpm / 1500 - OMEGA_REF), 6)
    // And it must be negative (sub-synchronous slip → braking force is also negative / resisting deceleration)
    expect(outputs.dampingTorque).toBeLessThan(0)
  })

  it('appears in initialState lastValidOutputs as 0', () => {
    const state = initialState()
    expect(state.lastValidOutputs.dampingTorque).toBe(0)
  })
})

// ── TAU_VALVE 0.3 s — valve convergence ──────────────────────────────────────

describe('valve actuator lag TAU_VALVE ≈ 0.3 s', () => {
  it('valveActual reaches ~63 % of step within ~0.3 s (one time constant)', () => {
    // Step valve from 0 → 100 % and check convergence at 0.3 s
    const seeded: SimState = {
      ...initialState(),
      omega: 0,
      valvePct: 100,
      valveActual: 0,
      collapsed: false,
    }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, avrOn: false }
    const { outputs } = advanceWithState(seeded, inputs, 0.3)
    // After one time constant, valveActual should be approximately 63 % of 100 % (1 − 1/e ≈ 0.632)
    expect(outputs.valveActual).toBeGreaterThan(50)
    expect(outputs.valveActual).toBeLessThan(80)
  })

  it('valve settles quickly — at 1.5 s it is >99 % of target', () => {
    const seeded: SimState = {
      ...initialState(),
      omega: 0,
      valvePct: 100,
      valveActual: 0,
      collapsed: false,
    }
    const inputs: Inputs = { ...DEFAULT_INPUTS, fieldVoltage: 0, loadFraction: 0, avrOn: false }
    const { outputs } = advanceWithState(seeded, inputs, 1.5) // 5× τ
    expect(outputs.valveActual).toBeGreaterThan(99)
  })
})
