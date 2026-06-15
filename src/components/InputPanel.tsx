/** Rotary-knob-style sliders: field DC, active load, power factor. No rotor-speed control. */

import type { Inputs } from '../core/types'

type Props = {
  inputs: Inputs
  avrCommand: number
  onSetInput: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
}

type KnobProps = {
  label: string
  min: number
  max: number
  step: number
  value: number
  display: string
  scaleMin: string
  scaleMax: string
  onChange: (v: number) => void
  readOnly?: boolean
  lockLabel?: string
  ptrRotation: number
}

function Knob({ label, min, max, step, value, display, scaleMin, scaleMax, onChange, readOnly, lockLabel, ptrRotation }: KnobProps) {
  return (
    <div className={`knob-wrap${readOnly ? ' locked' : ''}`}>
      <div className="card">{label}</div>
      <div className="knob-hitbox">
        <div className="knob">
          <div className="ptr" style={{ transform: `rotate(${ptrRotation}deg)` }} />
          <div className="hub" />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          aria-label={label}
          className="knob-range"
          title={display}
        />
      </div>
      <div className="scale">
        <span>{scaleMin}</span>
        <span>{scaleMax}</span>
      </div>
      <div className="plate">{display}</div>
      {lockLabel && <div className="locktag">{lockLabel}</div>}
    </div>
  )
}

export function InputPanel({ inputs, avrCommand, onSetInput }: Props) {
  const fieldValue = inputs.avrOn ? avrCommand : inputs.fieldVoltage
  const pfSigned = inputs.pfLag ? inputs.powerFactor : -inputs.powerFactor
  const pfSign = inputs.pfLag ? 'lag' : 'ld'

  return (
    <div className="controls">
      <div className="drag-hint">← drag knobs →</div>

      <Knob
        label="EXCITER FIELD DC"
        min={0}
        max={1.5}
        step={0.01}
        value={fieldValue}
        display={`${fieldValue.toFixed(2)} pu`}
        scaleMin="0"
        scaleMax="1.5"
        readOnly={inputs.avrOn}
        lockLabel={inputs.avrOn ? 'AVR COMMANDING' : undefined}
        ptrRotation={-130 + (fieldValue / 1.5) * 260}
        onChange={(v) => onSetInput('fieldVoltage', v)}
      />
      <Knob
        label="ACTIVE LOAD"
        min={0}
        max={1}
        step={0.01}
        value={inputs.loadFraction}
        display={`${Math.round(inputs.loadFraction * 100)} %`}
        scaleMin="0 %"
        scaleMax="100 %"
        ptrRotation={-130 + inputs.loadFraction * 260}
        onChange={(v) => onSetInput('loadFraction', v)}
      />
      <div className="knob-wrap">
        <div className="card">POWER FACTOR</div>
        <div className="knob-hitbox">
          <div className="knob">
            <div className="ptr" style={{ transform: `rotate(${-130 + ((inputs.powerFactor - 0.6) / 0.4) * 260}deg)` }} />
            <div className="hub" />
          </div>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={pfSigned}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              onSetInput('powerFactor', Math.abs(v) < 0.6 ? 0.6 : Math.abs(v))
              onSetInput('pfLag', v >= 0)
            }}
            aria-label="Power factor"
            className="knob-range"
            title={`${inputs.powerFactor.toFixed(2)} ${pfSign}`}
          />
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
