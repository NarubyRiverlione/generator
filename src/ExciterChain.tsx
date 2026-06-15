/** Three exciter-chain meters: AC output, rectified DC, main field current. */

import { fieldToExciterAC, fieldToFieldCurrent, fieldToRectifiedDC } from './core/units'
import { Gauge } from './components/Gauge'

type Props = { iFieldPu: number }

const EXCITER_ZONES = [{ end: 0.75, color: '#20c24a' }]

export function ExciterChain({ iFieldPu }: Props) {
  const acV = fieldToExciterAC(iFieldPu)
  const dcV = fieldToRectifiedDC(iFieldPu)
  const iA = fieldToFieldCurrent(iFieldPu)

  return (
    <>
      <Gauge
        value={acV}
        min={0}
        max={150}
        unit="V AC"
        label="EXCITER OUTPUT"
        subLabel="0 – 150 V AC"
        zones={EXCITER_ZONES}
      />
      <Gauge
        value={dcV}
        min={0}
        max={150}
        unit="V DC"
        label="RECTIFIED OUTPUT"
        subLabel="0 – 150 V DC"
        zones={EXCITER_ZONES}
      />
      <Gauge value={iA} min={0} max={10} unit="A" label="MAIN FIELD" subLabel="0 – 10 A" zones={EXCITER_ZONES} />
    </>
  )
}
