/** Shared rotary knob. Click left half to decrease, right half to increase. */

// Tick positions at 25/50/75/100 % of the 260° sweep (-130° to +130°).
// CX=65 (half of 130px wrap), CY=54 (knob-gap 10 + knob-radius 44).
// R_IN=51 clears the 6px chrome shadow; R_OUT=58 gives a 7px tick.
const TICK_LINES = [0.25, 0.5, 0.75, 1.0].map((pct) => {
  const rad = (-130 + pct * 260) * (Math.PI / 180)
  const s = Math.sin(rad)
  const c = Math.cos(rad)
  return { x1: 65 + 51 * s, y1: 54 - 51 * c, x2: 65 + 58 * s, y2: 54 - 58 * c }
})

export function KnobTicks() {
  return (
    <svg className="knob-ticks" viewBox="0 0 130 108" aria-hidden="true">
      {TICK_LINES.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
      ))}
    </svg>
  )
}

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

export function Knob({
  label,
  min,
  max,
  step,
  value,
  display,
  scaleMin,
  scaleMax,
  onChange,
  readOnly,
  lockLabel,
  ptrRotation,
}: KnobProps) {
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
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      adjust(-step)
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      adjust(step)
    }
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
        <KnobTicks />
        <span className="knob-corner tl">▼</span>
        <span className="knob-corner tr">▲</span>
        <div className="knob">
          <div className="ptr" style={{ transform: `rotate(${ptrRotation}deg)` }} />
          <div className="hub" />
        </div>
        <span className="knob-corner bl">▼▼</span>
        <span className="knob-corner br">▲▲</span>
      </div>
      <div className="scale">
        <span>{scaleMin}</span>
        <span>{scaleMax}</span>
      </div>
      <div className="plate">{display}</div>
      <div className="locktag">{lockLabel ?? ' '}</div>
    </div>
  )
}
