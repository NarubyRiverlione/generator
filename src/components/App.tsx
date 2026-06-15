/**
 * Two-column desktop / stacked mobile layout.
 * Row 1: all meters in signal-chain order (exciter AC → rectified DC → field current → Vₜ → P).
 *         EXCITER FIELD DC knob sits below AC OUTPUT; ACTIVE LOAD knob sits below ACTIVE POWER P.
 * Row 2: LCD + indicator bulbs (left) | AVR pushbutton controls (right).
 * Row 3: power-factor knob.
 */

import { AvrControl } from './AvrControl'
import { ExciterChain } from './ExciterChain'
import { InputPanel } from './InputPanel'
import { ReadoutPanel } from './ReadoutPanel'
import { StatusDisplay } from './StatusDisplay'
import { useGeneratorSimulation } from '../hooks/useGeneratorSimulation'

export default function App() {
  const { inputs, outputs, setInput } = useGeneratorSimulation()

  const fieldValue = inputs.avrOn ? outputs.avrCommand : inputs.fieldVoltage

  return (
    <div className="panel">
      <p className="panel-title">
        <b>SYNCHRONOUS GENERATOR</b>&nbsp;·&nbsp;400 V · 50 Hz · 1 MVA · ISLANDED
      </p>

      {outputs.collapsed && (
        <div className="collapsed-banner">⚠ VOLTAGE COLLAPSE — REDUCE LOAD OR INCREASE FIELD</div>
      )}

      {/* Row 1: all meters in signal-chain order */}
      <div className="meters">
        <ExciterChain
          iFieldPu={outputs.avrCommand}
          fieldValue={fieldValue}
          avrOn={inputs.avrOn}
          onFieldChange={(v) => setInput('fieldVoltage', v)}
        />
        <ReadoutPanel
          outputs={outputs}
          loadFraction={inputs.loadFraction}
          onLoadChange={(v) => setInput('loadFraction', v)}
        />
      </div>

      {/* Row 2: LCD + indicators (left), AVR controls (right) */}
      <div className="band">
        <StatusDisplay avrOn={inputs.avrOn} outputs={outputs} />
        <AvrControl inputs={inputs} outputs={outputs} onSetInput={setInput} />
      </div>

      {/* Row 3: power-factor knob */}
      <InputPanel inputs={inputs} onSetInput={setInput} />

      <div className="footer">PHASE 1 MVP · ISLANDED STEADY-STATE SIMULATOR</div>
    </div>
  )
}
