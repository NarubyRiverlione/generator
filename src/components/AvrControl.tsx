/** AVR selector switch and Vref knob. */

import type { Inputs } from '../core/types'

type Props = {
  inputs: Inputs
  onSetInput: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
}

export function AvrControl({ inputs, onSetInput }: Props) {
  return (
    <div className="avr-section">
      <div className="sel-wrap">
        <div className="card" style={{ marginBottom: 8 }}>AVR</div>
        <div className="sel-positions">
          <span>0</span>
          <span>1</span>
        </div>
        <button
          className="sel-switch"
          onClick={() => onSetInput('avrOn', !inputs.avrOn)}
          aria-pressed={inputs.avrOn}
          title={inputs.avrOn ? 'AVR ON — click to turn off' : 'AVR OFF — click to turn on'}
        >
          <div
            className="sel-face"
            style={{ transform: `rotate(${inputs.avrOn ? 45 : -45}deg)` }}
          >
            <div className="sel-bar" />
          </div>
        </button>
      </div>

    </div>
  )
}
