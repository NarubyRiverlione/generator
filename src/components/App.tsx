/**
 * Two-column desktop / stacked mobile layout.
 * Row 1: all meters in signal-chain order (exciter AC → rectified DC → field current → Vₜ → P).
 * Row 2: LCD + indicator bulbs (left) | AVR pushbutton controls (right).
 * Row 3: rotary knob controls.
 */

import { AvrControl } from './AvrControl'
import { ExciterChain } from './ExciterChain'
import { InputPanel } from './InputPanel'
import { ReadoutPanel } from './ReadoutPanel'
import { StatusDisplay } from './StatusDisplay'
import { useGeneratorSimulation } from '../hooks/useGeneratorSimulation'

export default function App() {
  const { inputs, outputs, setInput } = useGeneratorSimulation()

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
        <ExciterChain iFieldPu={outputs.avrCommand} />
        <ReadoutPanel outputs={outputs} />
      </div>

      {/* Row 2: LCD + indicators (left), AVR controls (right) */}
      <div className="band">
        <StatusDisplay avrOn={inputs.avrOn} outputs={outputs} />
        <AvrControl inputs={inputs} outputs={outputs} onSetInput={setInput} />
      </div>

      {/* Row 3: rotary knob controls */}
      <InputPanel inputs={inputs} avrCommand={outputs.avrCommand} onSetInput={setInput} />

      <div className="footer">PHASE 1 MVP · ISLANDED STEADY-STATE SIMULATOR</div>
    </div>
  )
}
