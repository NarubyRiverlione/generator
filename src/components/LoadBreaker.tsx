/** Panel-mount load breaker — gates the ship load as a single instantaneous step. */

import { BREAKER_ARM_RPM, BREAKER_ARM_WINDOW } from '../core/constants'

type Props = {
  closed: boolean
  rpm: number
  onToggle: (closed: boolean) => void
}

export function LoadBreaker({ closed, rpm, onToggle }: Props) {
  // Arming only gates the open→close transition; a closed breaker can always be opened.
  const canClose = Math.abs(rpm - BREAKER_ARM_RPM) <= BREAKER_ARM_WINDOW
  const interactive = closed || canClose

  return (
    <div className="load-breaker">
      <div className="card">LOAD BREAKER</div>
      <button
        className={`breaker-btn${closed ? ' breaker-closed' : ' breaker-open'}${!interactive ? ' breaker-disabled' : ''}`}
        disabled={!interactive}
        onClick={() => interactive && onToggle(!closed)}
        title={closed ? 'Breaker CLOSED — click to open' : canClose ? 'Breaker OPEN — click to close' : `Arms within ±${BREAKER_ARM_WINDOW} rpm of ${BREAKER_ARM_RPM} rpm`}
      >
        <span className="breaker-state">{closed ? 'CLOSED' : 'OPEN'}</span>
      </button>
    </div>
  )
}
