/** Panel-mount load breaker — gates the ship load as a single instantaneous step. */

import { RPM_RATED } from '../core/constants'

const ARM_RPM = 0.95 * RPM_RATED // ~1425 rpm

type Props = {
  closed: boolean
  rpm: number
  onToggle: (closed: boolean) => void
}

export function LoadBreaker({ closed, rpm, onToggle }: Props) {
  const armed = rpm >= ARM_RPM

  return (
    <div className="load-breaker">
      <div className="card">LOAD BREAKER</div>
      <button
        className={`breaker-btn${closed ? ' breaker-closed' : ' breaker-open'}${!armed ? ' breaker-disabled' : ''}`}
        disabled={!armed}
        onClick={() => armed && onToggle(!closed)}
        title={!armed ? `Arm at ≥ ${ARM_RPM.toFixed(0)} rpm` : closed ? 'Breaker CLOSED — click to open' : 'Breaker OPEN — click to close'}
      >
        <span className="breaker-state">{closed ? 'CLOSED' : 'OPEN'}</span>
      </button>
    </div>
  )
}
