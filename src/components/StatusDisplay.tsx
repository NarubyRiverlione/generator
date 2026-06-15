/** LCD screen and reference sticky note. */

import { puToKVAR, puToVolts } from '../core/units'
import type { Outputs } from '../core/types'

const DEG = 180 / Math.PI

type Props = { outputs: Outputs }

export function StatusDisplay({ outputs }: Props) {
  const vtV = puToVolts(outputs.vt)
  const qKVAR = puToKVAR(outputs.q)
  const deltaDegs = outputs.delta * DEG
  const deltaWarn = deltaDegs > 70
  const deltaRed = deltaDegs > 85
  const qLabel = outputs.q >= 0 ? 'supplying' : 'absorbing'
  const pfAbs = Math.abs(outputs.pf).toFixed(2)
  const pfSign = outputs.pf < 0 ? 'lead' : 'lag'

  return (
    <div className="lcd-mod">
      <div className="screen">
        <div className="l1">
          <span>Vt {vtV.toFixed(0)} V</span>
          <span>f 50.0 Hz</span>
        </div>
        <div className="l2">
          <span className={deltaRed ? 'warn-red' : deltaWarn ? 'warn-amber' : ''}>
            δ {deltaDegs.toFixed(1)}°{deltaWarn ? ' ⚠' : ''}
          </span>
          <span>Q {outputs.q >= 0 ? '+' : ''}{qKVAR.toFixed(0)} kVAR</span>
        </div>
        <div className="l3">
          <span>{qLabel.toUpperCase()}</span>
          <span>PF {pfAbs} {pfSign}</span>
        </div>
      </div>

      <div className="sticky-note">
        <div className="sticky-line"><span className="sticky-key">Vt</span> Terminal voltage (rated 400 V)</div>
        <div className="sticky-line"><span className="sticky-key">f</span> Frequency — fixed 50 Hz (Phase 1)</div>
        <div className="sticky-line"><span className="sticky-key">δ</span> Load angle — warn &gt; 70°, danger &gt; 85°</div>
        <div className="sticky-line"><span className="sticky-key">Q</span> Reactive power — + supplying, − absorbing</div>
        <div className="sticky-line"><span className="sticky-key">PF</span> Power factor — lag = inductive, ld = capacitive</div>
        <div className="sticky-line"><span className="sticky-key">τ</span> Field settles in ~1.5 s (first-order lag)</div>
      </div>
    </div>
  )
}
