/** rAF-driven simulation loop. All physics delegated to core.step; no circuit math here. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_INPUTS, PARAMS } from '../core/constants'
import { initialState, step } from '../core/simulation'
import type { Inputs, Outputs, SimState } from '../core/types'

const MAX_DT = 0.1 // clamp large dt (e.g. tab refocus) to 100 ms
const TARGET_DT = 0.033 // ~30 ms cadence

export type SimHook = {
  inputs: Inputs
  outputs: Outputs
  setInput: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
}

export function useGeneratorSimulation(): SimHook {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS)
  const [outputs, setOutputs] = useState<Outputs>(() => initialState().lastValidOutputs)

  const stateRef = useRef<SimState>(initialState())
  const inputsRef = useRef<Inputs>(DEFAULT_INPUTS)
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

  return { inputs, outputs, setInput }
}
