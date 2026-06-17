/**
 * Twin-needle valve position indicator: 270° circular arc, setpoint vs. actual.
 */

import type { ReactNode } from 'react'

type Props = {
  setpoint: number
  actual: number
  label?: string
  subLabel?: string
  children?: ReactNode
}

// viewBox 130×130, pivot at face center
const CX = 65
const CY = 65
const R = 52

// Arc: 225° (7 o'clock) → −45° (5 o'clock) clockwise in standard-math coords (270° sweep).
// fracToXY uses CY − R·sin(a) to map standard-math angles to SVG screen coords.
const A_START = (225 * Math.PI) / 180
const A_SPAN = (270 * Math.PI) / 180

function fracToXY(f: number): [number, number] {
  const a = A_START - f * A_SPAN
  return [CX + R * Math.cos(a), CY - R * Math.sin(a)]
}

// Arc path from f0 to f1 (clockwise in screen coords, sweep-flag=1).
// large-arc-flag is 1 when the segment exceeds 180°.
function zonePath(f0: number, f1: number): string {
  const [x1, y1] = fracToXY(f0)
  const [x2, y2] = fracToXY(f1)
  const largeArc = (f1 - f0) * 270 > 180 ? 1 : 0
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`
}

const TICK_FRACS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
const TICK_LABELS = ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100']

export function PositionIndicator({
  setpoint,
  actual,
  label = 'VALVE POSITION',
  subLabel = '0 – 100 %',
  children,
}: Props) {
  const aFrac = Math.max(0, Math.min(1, actual / 100))
  const sFrac = Math.max(0, Math.min(1, setpoint / 100))

  // Actual needle tip at 82% of radius
  const aAngle = A_START - aFrac * A_SPAN
  const anx = CX + R * 0.82 * Math.cos(aAngle)
  const any = CY - R * 0.82 * Math.sin(aAngle)

  // Setpoint needle tip at 75% of radius + open chevron
  const sAngle = A_START - sFrac * A_SPAN
  const stx = CX + R * 0.75 * Math.cos(sAngle)
  const sty = CY - R * 0.75 * Math.sin(sAngle)

  // Chevron: apex at tip, two barbs 6px back and 3.5px to each side
  const dirX = Math.cos(sAngle)
  const dirY = -Math.sin(sAngle)
  const perpX = -dirY
  const perpY = dirX
  const bx = stx - 6 * dirX
  const by = sty - 6 * dirY
  const chevron = [
    `${stx.toFixed(2)},${sty.toFixed(2)}`,
    `${(bx + 3.5 * perpX).toFixed(2)},${(by + 3.5 * perpY).toFixed(2)}`,
    `${(bx - 3.5 * perpX).toFixed(2)},${(by - 3.5 * perpY).toFixed(2)}`,
  ].join(' ')

  return (
    <div className="gauge-col">
      <div className="card">
        {label}
        <small>{subLabel}</small>
      </div>
      <div className="gap" />
      <div className="round-bezel">
        <div className="round-face">
          <svg
            viewBox="0 0 130 130"
            aria-label={`Valve position: setpoint ${setpoint.toFixed(1)}%, actual ${actual.toFixed(1)}%`}
          >
            {/* Base track arc */}
            <path d={zonePath(0, 1)} fill="none" stroke="#2a2a2a" strokeWidth={1.5} />

            {/* Tick marks at 0, 25, 50, 75, 100% */}
            {TICK_FRACS.map((f, i) => {
              const [ox, oy] = fracToXY(f)
              const ix = CX + (ox - CX) * 0.88
              const iy = CY + (oy - CY) * 0.88
              const lx = CX + (ox - CX) * 0.66
              const ly = CY + (oy - CY) * 0.66
              return (
                <g key={f}>
                  <line
                    x1={ox.toFixed(2)}
                    y1={oy.toFixed(2)}
                    x2={ix.toFixed(2)}
                    y2={iy.toFixed(2)}
                    stroke="#0008"
                    strokeWidth={1.5}
                  />
                  <text
                    x={lx.toFixed(2)}
                    y={ly.toFixed(2)}
                    fontSize={7}
                    fill="#333"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {TICK_LABELS[i]}
                  </text>
                </g>
              )
            })}

            {/* Setpoint needle (thin red, drawn below actual) */}
            <line x1={CX} y1={CY} x2={stx.toFixed(2)} y2={sty.toFixed(2)} stroke="#c0392b" strokeWidth={1.5} />
            <polygon points={chevron} fill="none" stroke="#c0392b" strokeWidth={1.5} />

            {/* Actual needle (bold black, drawn on top) */}
            <line x1={CX} y1={CY} x2={anx.toFixed(2)} y2={any.toFixed(2)} stroke="#111" strokeWidth={2.5} />
            <rect x={CX - 4} y={CY - 4} width={8} height={8} rx={1} fill="#3a2a14" />
          </svg>
        </div>
      </div>
      {children}
    </div>
  )
}
