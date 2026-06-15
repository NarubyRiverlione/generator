/** rAF-driven simulation loop. All physics delegated to core.step; no circuit math here. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_INPUTS, PARAMS, RELAY27_TRIP_VT } from '../core/constants'
import { initialState, step } from '../core/simulation'
import type { Inputs, Outputs, SimState } from '../core/types'

const MAX_DT = 0.1 // clamp large dt (e.g. tab refocus) to 100 ms
const TARGET_DT = 0.033 // ~30 ms cadence

export type SimHook = {
  inputs: Inputs
  outputs: Outputs
  setInput: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
  relay27Tripped: boolean
  resetRelay27: () => void
}

export function useGeneratorSimulation(): SimHook {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS)
  const [outputs, setOutputs] = useState<Outputs>(() => initialState().lastValidOutputs)
  const [relay27Tripped, setRelay27Tripped] = useState<boolean>(false)

  const stateRef = useRef<SimState>(initialState())
  const inputsRef = useRef<Inputs>(DEFAULT_INPUTS)
  const relay27Ref = useRef<boolean>(false)
  // Relay only arms once Vt has risen above the trip threshold (startup inhibit)
  const relay27ArmedRef = useRef<boolean>(false)
  const lastTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

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

        const result = step(stateRef.current, inputsRef.current, PARAMS, dt)
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

  return { inputs, outputs, setInput, relay27Tripped, resetRelay27 }
}
