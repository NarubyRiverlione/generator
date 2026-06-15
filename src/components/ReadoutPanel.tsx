/** Terminal voltage and active power gauges (signal-chain meter row). */

import { puToKW, puToVolts } from '../core/units'
import type { Outputs } from '../core/types'
import { Gauge } from './Gauge'
import { Knob } from './Knob'

type Props = {
  outputs: Outputs
  loadFraction: number
  onLoadChange: (v: number) => void
}

// Vₜ: amber (0–25%) / green (25–85%) / amber (85–92%) / red (92–100%)
const VT_ZONES = [
  { end: 0.25, color: '#e8a02a' },
  { end: 0.85, color: '#20c24a' },
  { end: 0.92, color: '#e8a02a' },
  { end: 1.0, color: '#e23b2e' },
]

// P: green (0–90%) / red (90–100%)
const P_ZONES = [
  { end: 0.9, color: '#20c24a' },
  { end: 1.0, color: '#e23b2e' },
]

export function ReadoutPanel({ outputs, loadFraction, onLoadChange }: Props) {
  const vtV = puToVolts(outputs.vt)
  const pKW = puToKW(outputs.p)

  return (
    <>
      <Gauge
        value={vtV}
        min={0}
        max={500}
        unit="V"
        label="TERMINAL VOLTAGE Vₜ"
        subLabel="0 – 500 V"
        zones={VT_ZONES}
      />
      <Gauge
        value={pKW}
        min={0}
        max={1000}
        unit="kW"
        label="ACTIVE POWER P"
        subLabel="0 – 1000 kW"
        zones={P_ZONES}
      >
        <Knob
          label="ACTIVE LOAD"
          min={0}
          max={1}
          step={0.01}
          value={loadFraction}
          display={`${Math.round(loadFraction * 100)} %`}
          scaleMin="0 %"
          scaleMax="100 %"
          ptrRotation={-130 + loadFraction * 260}
          onChange={onLoadChange}
        />
      </Gauge>
    </>
  )
}
