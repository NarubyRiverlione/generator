/** Split indicator legend — top half (rows 1-2) or bottom half (rows 3-4). */

import { AVR_COMMAND_MAX } from '../core/constants'
import type { Outputs } from '../core/types'

const DEG = 180 / Math.PI

type Props = {
  avrOn: boolean
  governorOn: boolean
  outputs: Outputs
  half: 'top' | 'bottom'
  relay27Tripped: boolean
}

export function IndicatorLights({ avrOn, governorOn, outputs, half, relay27Tripped }: Props) {
  const deltaWarn = outputs.delta * DEG > 70
  const fieldAtCeiling = avrOn && outputs.avrCommand >= AVR_COMMAND_MAX - 0.01
  const govAtCeiling = governorOn && outputs.governorCommand >= 100 - 0.01

  if (half === 'top') {
    return (
      <div className="indicator-block">
        <div className="indicator-row">
          <span className="led on" />
          <span>GENERATOR RUN</span>
        </div>
        <div className="indicator-row">
          <span className={`led${avrOn ? ' on' : ''}`} />
          <span>AVR ACTIVE</span>
        </div>
        <div className="indicator-row">
          <span className={`led${fieldAtCeiling ? ' amber' : ''}`} />
          <span>FIELD AT CEILING</span>
        </div>
        <div className="indicator-row">
          <span className={`led${deltaWarn ? ' amber' : ''}`} />
          <span>δ → 90° WARN</span>
        </div>
      </div>
    )
  }

  return (
    <div className="indicator-block">
      <div className="indicator-row">
        <span className={`led${relay27Tripped ? ' on red-led' : ''}`} />
        <span>27 RELAY TRIP</span>
      </div>
      <div className="indicator-row">
        <span className={`led${governorOn ? ' on' : ''}`} />
        <span>GOV ACTIVE</span>
      </div>
      <div className="indicator-row">
        <span className={`led${govAtCeiling ? ' amber' : ''}`} />
        <span>VALVE AT CEILING</span>
      </div>
      <div className="indicator-row">
        <span className={`led${outputs.q >= 0 ? ' on' : ''}`} />
        <span>Q SUPPLYING</span>
      </div>
    </div>
  )
}
