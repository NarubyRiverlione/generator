/** Terminal voltage and active power gauges (signal-chain meter row). */

import { puToKW, puToVolts } from '../core/units'
import type { Outputs } from '../core/types'
import { Gauge } from './Gauge'

type Props = { outputs: Outputs }

// Range 0–420 V: 0–390 orange, 390–410 green, 410–420 red.
const VT_ZONES = [
  { end: 390 / 420, color: '#e8a02a' },
  { end: 410 / 420, color: '#20c24a' },
  { end: 1.0, color: '#e23b2e' },
]

const P_ZONES = [
  { end: 0.9, color: '#20c24a' },
  { end: 1.0, color: '#e23b2e' },
]

export function ReadoutPanel({ outputs }: Props) {
  const vtV = puToVolts(outputs.vt)
  const pKW = puToKW(outputs.p)

  return (
    <>
      <Gauge value={vtV} min={0} max={420} unit="V" label="TERMINAL Vₜ" subLabel="0 – 420 V" zones={VT_ZONES} />
      <Gauge value={pKW} min={0} max={1000} unit="kW" label="ACTIVE POWER P" subLabel="0 – 1000 kW" zones={P_ZONES} />
    </>
  )
}
