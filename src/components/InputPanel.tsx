/** Rotary-knob controls: power factor. Click left half to decrease, right to increase. */

import type { Inputs } from '../core/types'
import { clamp } from './Knob'

type Props = {
  inputs: Inputs
  onSetInput: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
}

export function InputPanel({ inputs, onSetInput }: Props) {
  const pfSigned = inputs.pfLag ? inputs.powerFactor : -inputs.powerFactor
  const pfSign = inputs.pfLag ? 'lag' : 'ld'

  function handlePfClick(e: React.MouseEvent<HTMLDivElement>) {
    const left = e.nativeEvent.offsetX < e.currentTarget.offsetWidth / 2
    const next = clamp(pfSigned + (left ? -0.01 : 0.01), -1, 1)
    const abs = Math.abs(next)
    onSetInput('powerFactor', abs < 0.6 ? 0.6 : parseFloat(abs.toFixed(10)))
    onSetInput('pfLag', next >= 0)
  }

  function handlePfKey(e: React.KeyboardEvent) {
    const delta = e.key === 'ArrowLeft' ? -0.01 : e.key === 'ArrowRight' ? 0.01 : 0
    if (!delta) return
    e.preventDefault()
    const next = clamp(pfSigned + delta, -1, 1)
    const abs = Math.abs(next)
    onSetInput('powerFactor', abs < 0.6 ? 0.6 : parseFloat(abs.toFixed(10)))
    onSetInput('pfLag', next >= 0)
  }

  return (
    <div className="controls">
      <div className="drag-hint">click left ▼ · right ▲</div>

      <div className="knob-wrap">
        <div className="card">POWER FACTOR</div>
        <div
          className="knob-hitbox knob-clickable"
          onClick={handlePfClick}
          onKeyDown={handlePfKey}
          role="slider"
          aria-label="Power factor"
          aria-valuemin={-1}
          aria-valuemax={1}
          aria-valuenow={pfSigned}
          tabIndex={0}
        >
          <div className="knob">
            <div className="ptr" style={{ transform: `rotate(${-130 + ((inputs.powerFactor - 0.6) / 0.4) * 260}deg)` }} />
            <div className="hub" />
          </div>
        </div>
        <div className="scale">
          <span>0.6 lag</span>
          <span>0.6 ld</span>
        </div>
        <div className="plate">{inputs.powerFactor.toFixed(2)} {pfSign}</div>
      </div>
    </div>
  )
}
