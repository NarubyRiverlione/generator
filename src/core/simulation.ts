/** Simulation step: field lag → AVR or manual target → machine solve. */

import { stepAvr } from './avr'
import {
  AVR_VREF,
  DEFAULT_INPUTS,
  JOG_FAST,
  JOG_SLOW,
  PARAMS,
  RPM_RATED,
  TAU_EXCITER,
  TAU_SPINUP,
  TAU_VALVE,
  VALVE_RPM_MAX,
} from './constants'
import { saturation } from './saturation'
import { computeLoad } from './load'
import { solveMachine } from './machine'
import type { Inputs, Outputs, Params, SimState, ValveCommand } from './types'

function jogRate(cmd: ValveCommand): number {
  if (cmd === 2) return JOG_FAST
  if (cmd === 1) return JOG_SLOW
  if (cmd === -1) return -JOG_SLOW
  if (cmd === -2) return -JOG_FAST
  return 0
}

// Default boot: shaft pre-spun to ~1495 rpm (slightly sub-synchronous); zero field (dark).
const VALVE_PCT_INIT = (1495 / VALVE_RPM_MAX) * 100 // ≈ 93.44 %
const SPEED_INIT_PU = 1495 / RPM_RATED // ≈ 0.9967

export function initialState(inputs: Inputs = DEFAULT_INPUTS, seed?: Partial<SimState>): SimState {
  // Laggeds: take from seed when present, else derive from inputs.
  const iField = seed?.iField ?? inputs.fieldVoltage
  const exciterLagged = seed?.exciterLagged ?? inputs.fieldVoltage
  const valvePct = seed?.valvePct ?? VALVE_PCT_INIT
  const valveActual = seed?.valveActual ?? VALVE_PCT_INIT
  const speedLagged = seed?.speedLagged ?? SPEED_INIT_PU

  // Derive lastValidOutputs from the seeded laggeds (same path as step()) so the first
  // painted frame is coherent with the seed — no needle-snap from zero.
  const ea = saturation(iField) * speedLagged
  const load = computeLoad(inputs.loadFraction, inputs.powerFactor, inputs.pfLag)
  const result = solveMachine(ea, load.p, load.q, PARAMS.xs)
  const rpm = speedLagged * RPM_RATED
  const frequencyHz = rpm / 30
  const saturationFactor = iField > 0 ? saturation(iField) / iField : 1

  const lastValidOutputs: Outputs = result.collapsed
    ? {
        vt: 0,
        ia: 0,
        delta: 0,
        p: 0,
        q: 0,
        pf: 1,
        iField,
        avrCommand: inputs.fieldVoltage,
        collapsed: false,
        stabilityMargin: 0,
        frequencyHz,
        rpm,
        valvePct,
        valveActual,
        saturationFactor,
        droopRpm: 0,
      }
    : {
        ...result,
        iField,
        avrCommand: inputs.fieldVoltage,
        collapsed: false,
        frequencyHz,
        rpm,
        valvePct,
        valveActual,
        saturationFactor,
        droopRpm: result.p * PARAMS.govDroop * RPM_RATED,
      }

  return {
    iField,
    exciterLagged,
    avrIntegral: seed?.avrIntegral ?? 0,
    valvePct,
    valveActual,
    speedLagged,
    lastValidOutputs,
  }
}

export type StepResult = { state: SimState; outputs: Outputs }

export function step(state: SimState, inputs: Inputs, params: Params, dt: number): StepResult {
  // AVR or manual field target
  let fieldTarget: number
  let avrCommand: number
  let avrIntegral: number

  if (inputs.avrOn) {
    const avr = stepAvr(AVR_VREF, state.lastValidOutputs.vt, state.avrIntegral, params.kp, params.ki, dt)
    fieldTarget = avr.command
    avrCommand = avr.command
    avrIntegral = avr.integral
  } else {
    fieldTarget = inputs.fieldVoltage
    avrCommand = inputs.fieldVoltage
    // Bumpless transfer: keep integral primed so AVR output = current fieldVoltage on engage.
    const error = AVR_VREF - state.lastValidOutputs.vt
    avrIntegral = params.ki !== 0 ? (inputs.fieldVoltage - params.kp * error) / params.ki : 0
  }

  // Two stacked first-order lags: exciter (TAU_EXCITER) → main field winding (params.tau).
  const exciterLagged = state.exciterLagged + (fieldTarget - state.exciterLagged) * (1 - Math.exp(-dt / TAU_EXCITER))
  const iField = state.iField + (exciterLagged - state.iField) * (1 - Math.exp(-dt / params.tau))

  // 2.1 Integrate valve: holds when valveCommand = 0, clamped to [0, 100]
  const valvePct = Math.min(100, Math.max(0, state.valvePct + jogRate(inputs.valveCommand) * dt))

  // Valve actuator lag: physical valve position chases setpoint with τ_valve
  const valveActual = Math.min(
    100,
    Math.max(0, state.valveActual + (valvePct - state.valveActual) * (1 - Math.exp(-dt / TAU_VALVE))),
  )

  // 2.2 Valve → RPM (shaft-primary); droop-corrected first-order lag.
  // Pe_prev from the previous step; one-step lag (~33 ms) is negligible at simulator cadence.
  const Pe_prev = state.lastValidOutputs.p
  const rpmTarget = (valveActual / 100) * VALVE_RPM_MAX
  const speedTarget_pu = rpmTarget / RPM_RATED
  const effectiveTarget = speedTarget_pu - Pe_prev * params.govDroop
  const speedLagged = state.speedLagged + (effectiveTarget - state.speedLagged) * (1 - Math.exp(-dt / TAU_SPINUP))

  // 2.3 Scale internal EMF by speed before circuit solve: Eₐ = saturation(field_lagged) × speed_pu
  const ea = saturation(iField) * speedLagged

  // 2.4 Derive readouts shaft-first: RPM → Hz (Hz is never an intermediate variable)
  const rpm = speedLagged * RPM_RATED
  const frequencyHz = rpm / 30

  // Machine solve
  const load = computeLoad(inputs.loadFraction, inputs.powerFactor, inputs.pfLag)
  const result = solveMachine(ea, load.p, load.q, params.xs)

  // Derived diagnostics: saturation derate (live with field) and load-droop rpm (tracks active power).
  const saturationFactor = iField > 0 ? saturation(iField) / iField : 1

  let outputs: Outputs
  if (result.collapsed) {
    // Freeze voltage outputs but keep shaft readouts live; valveActual is shaft-side — stays live
    const droopRpm = state.lastValidOutputs.p * params.govDroop * RPM_RATED
    outputs = {
      ...state.lastValidOutputs,
      iField,
      avrCommand,
      collapsed: true,
      frequencyHz,
      rpm,
      valvePct,
      valveActual,
      saturationFactor,
      droopRpm,
    }
  } else {
    const droopRpm = result.p * params.govDroop * RPM_RATED
    outputs = {
      ...result,
      iField,
      avrCommand,
      collapsed: false,
      frequencyHz,
      rpm,
      valvePct,
      valveActual,
      saturationFactor,
      droopRpm,
    }
  }

  const nextState: SimState = {
    iField,
    exciterLagged,
    avrIntegral,
    valvePct,
    valveActual,
    speedLagged,
    lastValidOutputs: result.collapsed ? state.lastValidOutputs : outputs,
  }

  return { state: nextState, outputs }
}
