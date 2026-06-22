/** rAF-driven simulation loop. All physics delegated to core.step; no circuit math here. */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GOV_RATE_LIMIT,
  IDLE_HOLD_KP,
  IDLE_HOLD_RATE_DOWN,
  IDLE_VALVE_NOLOAD,
  IDLE_VALVE_PCT,
  OMEGA_GOV_ENABLE,
  OMEGA_IDLE_PRECUT,
  PARAMS,
  RELAY27_TRIP_VT,
} from '../core/constants'
import { resolvePreset } from '../core/presets'
import { initialState, step } from '../core/simulation'
import type { Inputs, Outputs, SimState, ValveCommand } from '../core/types'

const MAX_DT = 0.1 // clamp large dt (e.g. tab refocus) to 100 ms
const TARGET_DT = 0.033 // ~30 ms cadence

export type SimHook = {
  inputs: Inputs
  outputs: Outputs
  setInput: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
  relay27Tripped: boolean
  resetRelay27: () => void
  setValveCommand: (cmd: ValveCommand) => void
  setLoadBreaker: (closed: boolean) => void
  startEngine: () => void
  stopEngine: () => void
}

export function useGeneratorSimulation(presetName?: string): SimHook {
  const preset = resolvePreset(presetName)
  const seedInputs: Inputs = { ...preset.inputs } as Inputs
  const boot = initialState(seedInputs, preset.seed)

  const [inputs, setInputs] = useState<Inputs>(seedInputs)
  const [outputs, setOutputs] = useState<Outputs>(boot.lastValidOutputs)
  const [relay27Tripped, setRelay27Tripped] = useState<boolean>(false)

  const stateRef = useRef<SimState>(boot)
  const inputsRef = useRef<Inputs>(seedInputs)
  const relay27Ref = useRef<boolean>(false)
  const relay27ArmedRef = useRef<boolean>(false)
  const lastTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  // valveCommand held outside React state so press-and-hold bypasses batching
  const valveCommandRef = useRef<ValveCommand>(0)

  // Auto-ramp target: null = no ramp, otherwise the target valve % (IDLE_VALVE_PCT or 0)
  const autoRampTargetRef = useRef<number | null>(null)
  // Set true when START is pressed; cleared when idle hold activates or STOP is pressed.
  const startedRef = useRef<boolean>(false)
  // Idle hold: P controller targeting IDLE_RPM, active from ramp-up hand-off until operator takes over
  const idleHoldRef = useRef<boolean>(false)

  useEffect(() => {
    inputsRef.current = inputs
  }, [inputs])

  useEffect(() => {
    let lastScheduled = 0

    function tick(timestamp: number) {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp
      }

      const raw = (timestamp - lastTimeRef.current) / 1000
      const dt = Math.min(raw, MAX_DT)

      if (timestamp - lastScheduled >= TARGET_DT * 1000) {
        lastTimeRef.current = timestamp
        lastScheduled = timestamp

        // Process momentary engine command — act then clear it immediately
        const cmd = inputsRef.current.engineCommand
        if (cmd === 'start') {
          autoRampTargetRef.current = IDLE_VALVE_PCT
          startedRef.current = true
          idleHoldRef.current = false
          inputsRef.current = { ...inputsRef.current, engineCommand: null }
          setInputs((prev) => ({ ...prev, engineCommand: null }))
        } else if (cmd === 'stop') {
          // Open breaker and disable governor/idle hold immediately; then ramp throttle to 0
          const stopped = { ...inputsRef.current, engineCommand: null, loadBreaker: false, governorOn: false }
          inputsRef.current = stopped
          setInputs(() => stopped)
          autoRampTargetRef.current = 0
          startedRef.current = false
          idleHoldRef.current = false
        }

        // Transition: hand off to the idle hold controller early (at OMEGA_IDLE_PRECUT, below idle speed)
        // so the valve has lead time to close before the shaft reaches OMEGA_GOV_ENABLE.
        // Without this, τ_valve lag means the physical valve is still 50% open at 1400 rpm and
        // the machine overshoots past the RUNNING threshold.
        if (startedRef.current && !idleHoldRef.current && stateRef.current.omega >= OMEGA_IDLE_PRECUT) {
          autoRampTargetRef.current = null
          startedRef.current = false
          idleHoldRef.current = true
        }

        // Auto-ramp: move valvePct toward target at GOV_RATE_LIMIT %/s before calling step()
        if (autoRampTargetRef.current !== null) {
          const targetPct = autoRampTargetRef.current
          const maxStep = GOV_RATE_LIMIT * dt
          const diff = targetPct - stateRef.current.valvePct
          const move = Math.sign(diff) * Math.min(Math.abs(diff), maxStep)
          stateRef.current = { ...stateRef.current, valvePct: stateRef.current.valvePct + move }
          if (Math.abs(diff) <= maxStep) {
            autoRampTargetRef.current = null
          }
        }

        // Idle hold: P controller with feedforward keeps the shaft at IDLE_RPM.
        // Released by any jog input or when the main governor engages.
        if (idleHoldRef.current) {
          if (valveCommandRef.current !== 0 || inputsRef.current.governorOn) {
            idleHoldRef.current = false
          } else {
            const error = OMEGA_GOV_ENABLE - stateRef.current.omega
            const desired = Math.min(100, Math.max(0, IDLE_VALVE_NOLOAD + IDLE_HOLD_KP * error))
            const rateLimit = desired < stateRef.current.valvePct ? IDLE_HOLD_RATE_DOWN : GOV_RATE_LIMIT
            const maxStep = rateLimit * dt
            const diff = desired - stateRef.current.valvePct
            const move = Math.sign(diff) * Math.min(Math.abs(diff), maxStep)
            stateRef.current = { ...stateRef.current, valvePct: stateRef.current.valvePct + move }
          }
        }

        const tickInputs: Inputs = {
          ...inputsRef.current,
          valveCommand: valveCommandRef.current,
          ...(relay27Ref.current ? { loadFraction: 0 } : {}),
        }
        const result = step(stateRef.current, tickInputs, PARAMS, dt)
        stateRef.current = result.state

        // Force-off on disarm: if a regulator lost its arm signal, clear the input too.
        if (!result.outputs.avrArmed && inputsRef.current.avrOn) {
          inputsRef.current = { ...inputsRef.current, avrOn: false }
          setInputs((prev) => ({ ...prev, avrOn: false }))
        }
        if (!result.outputs.govArmed && inputsRef.current.governorOn) {
          inputsRef.current = { ...inputsRef.current, governorOn: false }
          setInputs((prev) => ({ ...prev, governorOn: false }))
        }

        setOutputs(result.outputs)

        if (result.outputs.vt >= RELAY27_TRIP_VT) relay27ArmedRef.current = true

        if (!relay27Ref.current && relay27ArmedRef.current && result.outputs.vt < RELAY27_TRIP_VT) {
          relay27Ref.current = true
          setRelay27Tripped(true)
          inputsRef.current = { ...inputsRef.current, loadFraction: 0 }
          setInputs((prev) => ({ ...prev, loadFraction: 0 }))
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const setInput = useCallback(<K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value }
      inputsRef.current = next
      return next
    })
  }, [])

  const resetRelay27 = useCallback(() => {
    relay27Ref.current = false
    relay27ArmedRef.current = false
    setRelay27Tripped(false)
  }, [])

  const setValveCommand = useCallback((cmd: ValveCommand) => {
    valveCommandRef.current = cmd
  }, [])

  const setLoadBreaker = useCallback((closed: boolean) => {
    setInputs((prev) => {
      const next = { ...prev, loadBreaker: closed }
      inputsRef.current = next
      return next
    })
  }, [])

  const startEngine = useCallback(() => {
    setInputs((prev) => {
      const next = { ...prev, engineCommand: 'start' as const }
      inputsRef.current = next
      return next
    })
  }, [])

  const stopEngine = useCallback(() => {
    setInputs((prev) => {
      const next = { ...prev, engineCommand: 'stop' as const }
      inputsRef.current = next
      return next
    })
  }, [])

  return { inputs, outputs, setInput, relay27Tripped, resetRelay27, setValveCommand, setLoadBreaker, startEngine, stopEngine }
}
