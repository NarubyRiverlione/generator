/** Panel-mount load breaker — unified IlluminatedButton style. */

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

  const lightState = closed ? 'red' : canClose ? 'green' : 'amber'

  return (
    <div className="illuminated-btn-wrap">
      <span className="illuminated-btn-label">LOAD{'\n'}BREAKER</span>
      <button
        className={`illuminated-btn${!interactive ? ' illuminated-btn--inhibited' : ''}`}
        onClick={() => interactive && onToggle(!closed)}
        title={closed ? 'Breaker CLOSED — click to open' : canClose ? 'Breaker OPEN — click to close' : `Arms within ±${BREAKER_ARM_WINDOW} rpm of ${BREAKER_ARM_RPM} rpm`}
        aria-pressed={closed}
      >
        <span className={`illuminated-btn-light illuminated-btn-light--${lightState} breaker-light`}>
          {closed ? 'CLOSED' : canClose ? 'OPEN' : ''}
        </span>
      </button>
    </div>
  )
}
