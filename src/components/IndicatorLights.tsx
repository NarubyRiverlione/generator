/** Split indicator legend — top half (rows 1-2) or bottom half (rows 3-4). */

import type { Outputs } from '../core/types'

const DEG = 180 / Math.PI

type Props = { avrOn: boolean; outputs: Outputs; half: 'top' | 'bottom' }

export function IndicatorLights({ avrOn, outputs, half }: Props) {
  const deltaWarn = outputs.delta * DEG > 70

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
          <span className="led" />
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
        <span className={`led${outputs.collapsed ? ' on red-led' : ''}`} />
        <span>VOLT COLLAPSE</span>
      </div>
      <div className="indicator-row">
        <span className={`led${outputs.q >= 0 ? ' on' : ''}`} />
        <span>Q SUPPLYING</span>
      </div>
      <div className="indicator-row">
        <span className={`led${outputs.pf >= 0 ? ' on' : ''}`} />
        <span>PF LAG</span>
      </div>
      <div className="indicator-row">
        <span className={`led${outputs.pf < 0 ? ' amber' : ''}`} />
        <span>PF LEAD</span>
      </div>
    </div>
  )
}
