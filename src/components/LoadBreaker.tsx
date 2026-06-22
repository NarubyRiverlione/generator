/** Panel-mount load breaker — gates the ship load as a single instantaneous step. */

import { BREAKER_ARM_RPM, BREAKER_ARM_WINDOW } from '../core/constants'

type Props = {
  closed: boolean
  rpm: number
  onToggle: (closed: boolean) => void
}

export function LoadBreaker({ closed, rpm, onToggle }: Props) {
  const armed = Math.abs(rpm - BREAKER_ARM_RPM) <= BREAKER_ARM_WINDOW

  return (
    <div className="load-breaker">
      <div className="card">LOAD BREAKER</div>
      <button
        className={`breaker-btn${closed ? ' breaker-closed' : ' breaker-open'}${!armed ? ' breaker-disabled' : ''}`}
        disabled={!armed}
        onClick={() => armed && onToggle(!closed)}
        title={!armed ? `Arms within ±${BREAKER_ARM_WINDOW} rpm of ${BREAKER_ARM_RPM} rpm` : closed ? 'Breaker CLOSED — click to open' : 'Breaker OPEN — click to close'}
      >
        <span className="breaker-state">{closed ? 'CLOSED' : 'OPEN'}</span>
      </button>
    </div>
  )
}
