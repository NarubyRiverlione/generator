/** AVR on/off pushbutton pair and Vref knob. */

import type { Inputs, Outputs } from '../core/types'

type Props = {
  inputs: Inputs
  outputs: Outputs
  onSetInput: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
}

export function AvrControl({ inputs, outputs, onSetInput }: Props) {
  return (
    <div className="avr-section">
      {/* AVR pushbuttons */}
      <div className="avr-row">
        <div className="pb">
          <button
            className={`dome${inputs.avrOn ? ' green active' : ' green'}`}
            onClick={() => onSetInput('avrOn', true)}
            aria-pressed={inputs.avrOn}
            title="AVR ON"
          />
          <div className="card">AVR ON</div>
        </div>
        <div className="pb">
          <button
            className={`dome${!inputs.avrOn ? ' red active' : ' red'}`}
            onClick={() => onSetInput('avrOn', false)}
            aria-pressed={!inputs.avrOn}
            title="AVR OFF"
          />
          <div className="card">AVR OFF</div>
        </div>
      </div>

      {inputs.avrOn && (
        <div className="knob-wrap vref-knob">
          <div className="card">AVR Vref</div>
          <div
            className="knob-hitbox knob-clickable"
            onClick={(e) => {
              const left = e.nativeEvent.offsetX < e.currentTarget.offsetWidth / 2
              const next = Math.max(0.95, Math.min(1.05, inputs.vref + (left ? -0.001 : 0.001)))
              onSetInput('vref', parseFloat(next.toFixed(10)))
            }}
            onKeyDown={(e) => {
              const delta = e.key === 'ArrowLeft' ? -0.001 : e.key === 'ArrowRight' ? 0.001 : 0
              if (!delta) return
              e.preventDefault()
              const next = Math.max(0.95, Math.min(1.05, inputs.vref + delta))
              onSetInput('vref', parseFloat(next.toFixed(10)))
            }}
            role="slider"
            aria-label="AVR voltage reference"
            aria-valuemin={0.95}
            aria-valuemax={1.05}
            aria-valuenow={inputs.vref}
            tabIndex={0}
          >
            <div className="knob">
              <div className="ptr" style={{ transform: `rotate(${-130 + ((inputs.vref - 0.95) / 0.1) * 260}deg)` }} />
              <div className="hub" />
            </div>
          </div>
          <div className="scale">
            <span>380 V</span>
            <span>420 V</span>
          </div>
          <div className="plate">{Math.round(inputs.vref * 400)} V</div>
        </div>
      )}
    </div>
  )
}
