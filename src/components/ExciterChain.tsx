/** Three exciter-chain meters: AC output, rectified DC, main field current. */

import { fieldToExciterAC, fieldToFieldCurrent, fieldToRectifiedDC } from '../core/units'
import { Gauge } from './Gauge'
import { Knob, clamp } from './Knob'

type Props = {
  iFieldPu: number
  fieldValue: number
  avrOn: boolean
  onFieldChange: (v: number) => void
}

// Green band (0–75%), dark track beyond
const EXCITER_ZONES = [{ end: 0.75, color: '#20c24a' }]

export function ExciterChain({ iFieldPu, fieldValue, avrOn, onFieldChange }: Props) {
  const acV = fieldToExciterAC(iFieldPu)
  const dcV = fieldToRectifiedDC(iFieldPu)
  const iA = fieldToFieldCurrent(iFieldPu)

  return (
    <>
      <Gauge
        value={acV}
        min={0}
        max={150}
        unit="V"
        label="EXCITER AC OUTPUT"
        subLabel="0 – 150 V"
        zones={EXCITER_ZONES}
      >
        <Knob
          label="EXCITER FIELD DC"
          min={0}
          max={1.5}
          step={0.01}
          value={fieldValue}
          display={`${fieldValue.toFixed(2)} pu`}
          scaleMin="0"
          scaleMax="1.5"
          readOnly={avrOn}
          lockLabel={avrOn ? 'AVR COMMANDING' : undefined}
          ptrRotation={-130 + (fieldValue / 1.5) * 260}
          onChange={(v) => onFieldChange(clamp(v, 0, 1.5))}
        />
      </Gauge>
      <Gauge
        value={dcV}
        min={0}
        max={150}
        unit="V="
        label="RECTIFIED DC TO MAIN FIELD"
        subLabel="0 – 150 V"
        zones={EXCITER_ZONES}
      />
      <Gauge
        value={iA}
        min={0}
        max={10}
        unit="A"
        label="MAIN FIELD CURRENT"
        subLabel="0 – 10 A"
        zones={EXCITER_ZONES}
      />
    </>
  )
}
