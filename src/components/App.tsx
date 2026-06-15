/**
 * 5-column switchboard grid layout:
 *   Row 1: [AC OUTPUT] [RECT DC] [MAIN FIELD] [TERMINAL Vt] [ACTIVE POWER P]
 *   Row 2: [exciter knob] [LCD col 2-4] [active load knob]
 *   Row 3: [lights 1-4]   [LCD cont.]   [power factor knob]
 *   Row 4: [lights 5-8]   [LCD cont.]
 *   Row 5: [AVR controls full-width]
 */

import { AvrControl } from './AvrControl'
import { ExciterChain } from './ExciterChain'
import { IndicatorLights } from './IndicatorLights'
import { Knob, clamp } from './Knob'
import { ReadoutPanel } from './ReadoutPanel'
import { StatusDisplay } from './StatusDisplay'
import { useGeneratorSimulation } from '../hooks/useGeneratorSimulation'

export default function App() {
  const { inputs, outputs, setInput } = useGeneratorSimulation()

  const fieldValue = inputs.avrOn ? outputs.avrCommand : inputs.fieldVoltage
  const pfSigned = inputs.pfLag ? inputs.powerFactor : -inputs.powerFactor

  function handlePfChange(v: number) {
    const abs = Math.abs(v)
    setInput('powerFactor', abs < 0.6 ? 0.6 : parseFloat(abs.toFixed(10)))
    setInput('pfLag', v >= 0)
  }

  return (
    <div className="panel">
      <p className="panel-title">
        <b>SYNCHRONOUS GENERATOR</b>&nbsp;·&nbsp;400 V · 50 Hz · 1 MVA · ISLANDED
      </p>

      {outputs.collapsed && (
        <div className="collapsed-banner">⚠ VOLTAGE COLLAPSE — REDUCE LOAD OR INCREASE FIELD</div>
      )}

      <div className="switchboard-grid">
        {/* Row 1: gauges — auto-placed, pinned to row 1 via CSS */}
        <ExciterChain iFieldPu={outputs.avrCommand} />
        <ReadoutPanel outputs={outputs} />

        {/* Row 2, col 1: exciter field knob — vertically centered */}
        <div className="knob-cell" style={{ gridColumn: 1, gridRow: 2, alignSelf: 'center' }}>
          <Knob
            label="EXCITER FIELD DC"
            min={0}
            max={1.5}
            step={0.01}
            value={fieldValue}
            display={`${fieldValue.toFixed(2)} pu`}
            scaleMin="0"
            scaleMax="1.5"
            readOnly={inputs.avrOn}
            lockLabel={inputs.avrOn ? 'AVR COMMANDING' : undefined}
            ptrRotation={-130 + (fieldValue / 1.5) * 260}
            onChange={(v) => setInput('fieldVoltage', clamp(v, 0, 1.5))}
          />
        </div>

        {/* Row 2, cols 2-4: LCD panel — height drives row 2 */}
        <div style={{ gridColumn: '2 / 5', gridRow: 2 }}>
          <StatusDisplay outputs={outputs} />
        </div>

        {/* Row 2, col 5: active load knob — vertically centered */}
        <div className="knob-cell" style={{ gridColumn: 5, gridRow: 2, alignSelf: 'center' }}>
          <Knob
            label="ACTIVE LOAD"
            min={0}
            max={1}
            step={0.01}
            value={inputs.loadFraction}
            display={`${Math.round(inputs.loadFraction * 100)} %`}
            scaleMin="0 %"
            scaleMax="100 %"
            ptrRotation={-130 + inputs.loadFraction * 260}
            onChange={(v) => setInput('loadFraction', v)}
          />
        </div>

        {/* Row 3, col 1: indicator lights (top 4) */}
        <div style={{ gridColumn: 1, gridRow: 3 }}>
          <IndicatorLights avrOn={inputs.avrOn} outputs={outputs} half="top" />
        </div>

        {/* Row 3, col 2: indicator lights (bottom 4) — next to top group */}
        <div style={{ gridColumn: 2, gridRow: 3 }}>
          <IndicatorLights avrOn={inputs.avrOn} outputs={outputs} half="bottom" />
        </div>

        {/* Row 3, col 5: power factor knob */}
        <div className="knob-cell" style={{ gridColumn: 5, gridRow: 3 }}>
          <Knob
            label="POWER FACTOR"
            min={-1}
            max={1}
            step={0.01}
            value={pfSigned}
            display={`${inputs.powerFactor.toFixed(2)} ${inputs.pfLag ? 'lag' : 'ld'}`}
            scaleMin="0.6 lag"
            scaleMax="0.6 ld"
            ptrRotation={-130 + ((inputs.powerFactor - 0.6) / 0.4) * 260}
            onChange={(v) => handlePfChange(clamp(v, -1, 1))}
          />
        </div>

        {/* Row 4: AVR controls full-width */}
        <div style={{ gridColumn: '1 / 6', gridRow: 4 }}>
          <AvrControl inputs={inputs} outputs={outputs} onSetInput={setInput} />
        </div>
      </div>

      <div className="footer">PHASE 1 MVP · ISLANDED STEADY-STATE SIMULATOR</div>
    </div>
  )
}
