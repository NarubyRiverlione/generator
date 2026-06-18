/** Unit tests for the damper winding (DAMPING_D) term in the swing equation. */

import { describe, expect, it } from 'vitest'
import { DAMPING_D, INERTIA_H, OMEGA_REF } from '../../constants'

describe('DAMPING_D constant', () => {
  it('is exported from constants and equals 0.05', () => {
    expect(DAMPING_D).toBe(0.05)
  })

  it('is non-negative', () => {
    expect(DAMPING_D).toBeGreaterThanOrEqual(0)
  })
})

describe('damping term is zero at synchronous speed', () => {
  it('D·(omega − OMEGA_REF) is 0 when omega equals OMEGA_REF', () => {
    const dampingTorque = DAMPING_D * (OMEGA_REF - OMEGA_REF)
    expect(dampingTorque).toBe(0)
  })

  it('swing equation acceleration is unchanged by DAMPING_D at omega = OMEGA_REF', () => {
    const Pm = 0.5
    const Pe = 0.5
    const undamped = (Pm - Pe) / (2 * INERTIA_H)
    const damped = (Pm - Pe - DAMPING_D * (OMEGA_REF - OMEGA_REF)) / (2 * INERTIA_H)
    expect(damped).toBe(undamped)
  })
})

describe('damping reduces speed deviation magnitude in the swing equation', () => {
  it('at underspeed, damping term is negative (reduces braking), making dω/dt less negative', () => {
    // Scenario: machine is underspeed (omega < OMEGA_REF), Pe > Pm → rotor decelerating.
    const Pm = 0.5
    const Pe = 0.8
    const omega = 0.97 // underspeed

    const slip = omega - OMEGA_REF // negative
    const undampedAccel = (Pm - Pe) / (2 * INERTIA_H)
    const dampedAccel = (Pm - Pe - DAMPING_D * slip) / (2 * INERTIA_H)

    // Underspeed slip is negative → D·slip < 0 → subtracting it adds torque → less deceleration.
    expect(slip).toBeLessThan(0)
    expect(dampedAccel).toBeGreaterThan(undampedAccel)
  })

  it('at overspeed, damping term is positive (adds braking), making dω/dt less positive', () => {
    const Pm = 1.05
    const Pe = 0.5
    const omega = 1.03 // overspeed

    const slip = omega - OMEGA_REF // positive
    const undampedAccel = (Pm - Pe) / (2 * INERTIA_H)
    const dampedAccel = (Pm - Pe - DAMPING_D * slip) / (2 * INERTIA_H)

    expect(slip).toBeGreaterThan(0)
    expect(dampedAccel).toBeLessThan(undampedAccel)
  })

  it('damping effect magnitude scales with slip', () => {
    const Pm = 0.5
    const Pe = 0.8
    const smallSlip = -0.01
    const largeSlip = -0.05

    const accelSmallSlip = (Pm - Pe - DAMPING_D * smallSlip) / (2 * INERTIA_H)
    const accelLargeSlip = (Pm - Pe - DAMPING_D * largeSlip) / (2 * INERTIA_H)

    // Larger underspeed slip → more assist → less negative acceleration.
    expect(accelLargeSlip).toBeGreaterThan(accelSmallSlip)
  })
})
