/** rAF-driven simulation loop. All physics delegated to core.step; no circuit math here. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { PARAMS, RELAY27_TRIP_VT } from '../core/constants'
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
  setCoarseValveCommand: (cmd: ValveCommand) => void
  setLoadBreaker: (closed: boolean) => void
}

export function useGeneratorSimulation(presetName?: string): SimHook {
  const preset = resolvePreset(presetName)
  const seedInputs: Inputs = { ...preset.inputs } as Inputs
  // Single call — reused for both outputs and stateRef so they never diverge.
  const boot = initialState(seedInputs, preset.seed)

  const [inputs, setInputs] = useState<Inputs>(seedInputs)
  const [outputs, setOutputs] = useState<Outputs>(boot.lastValidOutputs)
  const [relay27Tripped, setRelay27Tripped] = useState<boolean>(false)

  const stateRef = useRef<SimState>(boot)
  const inputsRef = useRef<Inputs>(seedInputs)
  const relay27Ref = useRef<boolean>(false)
  // Relay only arms once Vt has risen above the trip threshold (startup inhibit)
  const relay27ArmedRef = useRef<boolean>(false)
  const lastTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    inputsRef.current = inputs
  }, [inputs])

  // valveCommand refs held outside React state so press-and-hold updates bypass batching
  const valveCommandRef = useRef<ValveCommand>(0)
  const coarseValveCommandRef = useRef<ValveCommand>(0)

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

        // Inject live switch positions; clamp load to 0 while relay is latched
        const tickInputs: Inputs = {
          ...inputsRef.current,
          valveCommand: valveCommandRef.current,
          coarseValveCommand: coarseValveCommandRef.current,
          ...(relay27Ref.current ? { loadFraction: 0 } : {}),
        }
        const result = step(stateRef.current, tickInputs, PARAMS, dt)
        stateRef.current = result.state
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

  const setCoarseValveCommand = useCallback((cmd: ValveCommand) => {
    coarseValveCommandRef.current = cmd
  }, [])

  const setLoadBreaker = useCallback((closed: boolean) => {
    setInputs((prev) => {
      const next = { ...prev, loadBreaker: closed }
      inputsRef.current = next
      return next
    })
  }, [])

  return { inputs, outputs, setInput, relay27Tripped, resetRelay27, setValveCommand, setCoarseValveCommand, setLoadBreaker }
}
