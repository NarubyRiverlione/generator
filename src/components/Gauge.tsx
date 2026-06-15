/**
 * Square switchboard meter matching wireframe-b geometry exactly.
 * Arc: r=78, center (65,104), endpoints (3.5,56)→(126.5,56), ~104° sweep.
 * Zone arcs drawn at the same radius as the base track — no gap.
 */

import type { ReactNode } from 'react'

type Zone = { end: number; color: string }
type GaugeProps = {
  value: number
  min: number
  max: number
  unit: string
  label: string
  subLabel: string
  zones: Zone[]
  children?: ReactNode
}

// Wireframe arc geometry
const CX = 65
const CY = 104
const R = 78

// Angle in standard-math (y-up) terms for left/right endpoints:
//   left  (3.5,  56): cos = (3.5-65)/78   = -0.7885, sin = (104-56)/78 = 0.6154
//   right (126.5,56): cos = (126.5-65)/78 = +0.7885, sin = 0.6154
const A_START = Math.atan2(CY - 56, 3.5 - CX) // atan2(48, -61.5) ≈ 2.476 rad  (left end, ~141.9°)
const A_END = Math.atan2(CY - 56, 126.5 - CX) // atan2(48, +61.5) ≈ 0.666 rad  (right end,  ~38.1°)
const A_SPAN = A_START - A_END // ≈ 1.810 rad — arc goes clockwise

// Map fraction [0,1] → SVG coordinates on the arc
function fracToXY(f: number): [number, number] {
  const a = A_START - f * A_SPAN
  return [CX + R * Math.cos(a), CY - R * Math.sin(a)]
}

// SVG arc path from fraction f0 to f1 (always short arc, clockwise sweep=1)
function zonePath(f0: number, f1: number): string {
  const [x1, y1] = fracToXY(f0)
  const [x2, y2] = fracToXY(f1)
  // Our full arc is only ~104° so large-arc is always 0
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)}`
}

// Needle tip at ~72% of the radius toward the arc
function needleTip(f: number): [number, number] {
  const [ax, ay] = fracToXY(Math.max(0, Math.min(1, f)))
  return [CX + (ax - CX) * 0.72, CY + (ay - CY) * 0.72]
}

// Fixed tick positions matching wireframe
const TICK_FRACS = [0, 0.25, 0.5, 0.75, 1]

export function Gauge({ value, min, max, unit, label, subLabel, zones, children }: GaugeProps) {
  const fraction = max > min ? (value - min) / (max - min) : 0
  const [lx, ly] = fracToXY(0)
  const [rx, ry] = fracToXY(1)
  const [nx, ny] = needleTip(fraction)

  return (
    <div className="gauge-col">
      <div className="card">
        {label}
        <small>{subLabel}</small>
      </div>
      <div className="gap" />
      <div className="sq-bezel">
        <div className="sq-face">
          <svg viewBox="0 0 130 120" aria-label={`${label}: ${value.toFixed(1)} ${unit}`}>
            {/* Dark base track — full arc */}
            <path
              d={`M${lx.toFixed(2)},${ly.toFixed(2)} A${R},${R} 0 0 1 ${rx.toFixed(2)},${ry.toFixed(2)}`}
              fill="none"
              stroke="#2a2a2a"
              strokeWidth={10}
            />

            {/* Coloured zone arcs on same radius — no gap */}
            {zones.map((z, i) => (
              <path
                key={i}
                d={zonePath(i === 0 ? 0 : zones[i - 1].end, z.end)}
                fill="none"
                stroke={z.color}
                strokeWidth={8}
              />
            ))}

            {/* Tick marks and value labels at 0, 25, 50, 75, 100% */}
            {TICK_FRACS.map((f) => {
              const [ox, oy] = fracToXY(f)
              const ix = CX + (ox - CX) * 0.88
              const iy = CY + (oy - CY) * 0.88
              const lx = CX + (ox - CX) * 0.66
              const ly = CY + (oy - CY) * 0.66
              const v = min + f * (max - min)
              const tickLabel = Number.isInteger(v) ? String(v) : v.toFixed(1)
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
                    {tickLabel}
                  </text>
                </g>
              )
            })}

            {/* Unit label */}
            <text x="14" y="92" fontSize={11} fill="#111" fontWeight="bold">
              {unit}
            </text>

            {/* Needle */}
            <line x1={CX} y1={CY} x2={nx.toFixed(2)} y2={ny.toFixed(2)} stroke="#111" strokeWidth={2.5} />
            <rect x={CX - 5} y={CY - 5} width={10} height={10} rx={1.5} fill="#3a2a14" />
          </svg>
        </div>
      </div>
      {children}
    </div>
  )
}
