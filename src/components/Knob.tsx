/** Shared rotary knob. Click left half to decrease, right half to increase. */

export type KnobProps = {
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

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

export function Knob({ label, min, max, step, value, display, scaleMin, scaleMax, onChange, readOnly, lockLabel, ptrRotation }: KnobProps) {
  function adjust(delta: number) {
    if (!readOnly) onChange(clamp(parseFloat((value + delta).toFixed(10)), min, max))
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const { offsetX, offsetY } = e.nativeEvent
    const { offsetWidth, offsetHeight } = e.currentTarget
    const left = offsetX < offsetWidth / 2
    const top = offsetY < offsetHeight / 2
    adjust((left ? -step : step) * (top ? 1 : 5))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); adjust(-step) }
    if (e.key === 'ArrowRight') { e.preventDefault(); adjust(step) }
  }

  return (
    <div className={`knob-wrap${readOnly ? ' locked' : ''}`}>
      <div className="card">{label}</div>
      <div
        className={`knob-hitbox${readOnly ? '' : ' knob-clickable'}`}
        onClick={handleClick}
        onKeyDown={handleKey}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-disabled={readOnly}
        tabIndex={readOnly ? -1 : 0}
      >
        <span className="knob-corner tl">−</span>
        <span className="knob-corner tr">+</span>
        <div className="knob">
          <div className="ptr" style={{ transform: `rotate(${ptrRotation}deg)` }} />
          <div className="hub" />
        </div>
        <span className="knob-corner bl">−−</span>
        <span className="knob-corner br">++</span>
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
