/**
 * 6-column switchboard grid layout:
 *   Row 1: [AC OUTPUT] [RECT DC] [MAIN FIELD] [TERMINAL Vt] [ACTIVE POWER P] [LOAD BREAKER]
 *   Row 2: [exciter knob] [LCD col 2-4] [active load knob] [fine SpringLoadedSelector]
 *   Row 3: [lights 1-4] [LCD cont.] [AVR SelectorSwitch] [27 relay] [power factor knob] [START/STOP + GOVERNOR]
 */

import { LoadBreaker } from './components/LoadBreaker'
import { IlluminatedButton } from './components/IlluminatedButton'
import { ExciterChain } from './ExciterChain'
import { SpringLoadedSelector } from './components/SpringLoadedSelector'
import { IndicatorLights } from './components/IndicatorLights'
import { Knob, clamp } from './components/Knob'
import { ReadoutPanel } from './components/ReadoutPanel'
import { StatusDisplay } from './components/StatusDisplay'
import { useGeneratorSimulation } from './hooks/useGeneratorSimulation'

export default function App() {
  const startParam = new URLSearchParams(window.location.search).get('start') ?? undefined
  const { inputs, outputs, setInput, relay27Tripped, resetRelay27, setValveCommand, setLoadBreaker, startEngine, stopEngine } =
    useGeneratorSimulation(startParam)

  const engineRunning = outputs.rpm > 30
  const engineAtIdle = outputs.rpm >= 1380

  const fieldValue = inputs.avrOn ? outputs.avrCommand : inputs.fieldVoltage
  const pfSigned = inputs.pfLag ? inputs.powerFactor : -inputs.powerFactor

  function handlePfChange(v: number) {
    const abs = Math.abs(v)
    // Symmetric 0.6 floor on both sides. Note: at full load the machine collapses
    // around 0.85-0.9 lagging (saturation ceiling caps the available field), so the
    // low-PF lagging range is reachable on the knob but not holdable under heavy load.
    const min = 0.6
    setInput('powerFactor', abs < min ? min : parseFloat(abs.toFixed(10)))
    setInput('pfLag', v >= 0)
  }

  return (
    <div className="panel">
      <p className="panel-title">
        <b>SYNCHRONOUS GENERATOR</b>&nbsp;·&nbsp;400 V · 50 Hz · 1 MVA · ISLANDED
      </p>

      <div className="switchboard-grid">
        {/* Row 1: gauges — auto-placed, pinned to row 1 via CSS */}
        <ExciterChain iFieldPu={outputs.rpm > 0 ? outputs.iField : 0} />
        <ReadoutPanel outputs={outputs} />

        {/* Row 2, col 1: exciter field knob — vertically centered */}
        <div className="knob-cell" style={{ gridColumn: 1, gridRow: 2, alignSelf: 'start' }}>
          <Knob
            label="EXCITER FIELD DC"
            min={0}
            max={1.7}
            step={0.01}
            value={fieldValue}
            display={`${fieldValue.toFixed(2)} pu`}
            scaleMin="0"
            scaleMax="1.7"
            readOnly={inputs.avrOn}
            lockLabel={inputs.avrOn ? 'AVR COMMANDING' : undefined}
            ptrRotation={-130 + (fieldValue / 1.7) * 260}
            onChange={(v) => setInput('fieldVoltage', clamp(v, 0, 1.7))}
          />
        </div>

        {/* Row 2, cols 2-4: LCD panel — height drives row 2 */}
        <div style={{ gridColumn: '2 / 5', gridRow: 2 }}>
          <StatusDisplay outputs={outputs} relay27Tripped={relay27Tripped} />
        </div>

        {/* Row 2, col 5: active load knob — vertically centered */}
        <div className="knob-cell" style={{ gridColumn: 5, gridRow: 2, alignSelf: 'start' }}>
          <Knob
            label="ACTIVE LOAD"
            min={0}
            max={1.2}
            step={0.01}
            value={inputs.loadFraction}
            display={`${Math.round(inputs.loadFraction * 100)} %`}
            scaleMin="0 %"
            scaleMax="120 %"
            ptrRotation={-130 + (inputs.loadFraction / 1.2) * 260}
            onChange={(v) => setInput('loadFraction', v)}
          />
        </div>

        {/* Row 3, col 1: indicator lights (top 4) — vertically centered */}
        <div style={{ gridColumn: 1, gridRow: 3, alignSelf: 'center' }}>
          <IndicatorLights
            avrOn={inputs.avrOn}
            governorOn={inputs.governorOn}
            outputs={outputs}
            half="top"
            relay27Tripped={relay27Tripped}
          />
        </div>

        {/* Row 3, col 2: indicator lights (bottom 4) — vertically centered */}
        <div style={{ gridColumn: 2, gridRow: 3, alignSelf: 'center' }}>
          <IndicatorLights
            avrOn={inputs.avrOn}
            governorOn={inputs.governorOn}
            outputs={outputs}
            half="bottom"
            relay27Tripped={relay27Tripped}
          />
        </div>

        {/* Row 3, col 5: power factor knob */}
        <div className="knob-cell" style={{ gridColumn: 5, gridRow: 3, alignSelf: 'start' }}>
          <Knob
            label="POWER FACTOR"
            min={-1}
            max={1}
            step={0.01}
            value={pfSigned}
            display={`${inputs.powerFactor.toFixed(2)} ${inputs.pfLag ? 'lag' : 'ld'}`}
            scaleMin="0.6"
            scaleMax="1.0"
            ptrRotation={-130 + ((inputs.powerFactor - 0.6) / 0.4) * 260}
            onChange={(v) => handlePfChange(clamp(v, -1, 1))}
          />
        </div>

        {/* Row 3, col 3: AVR IlluminatedButton */}
        <div className="knob-cell" style={{ gridColumn: 3, gridRow: 3, alignSelf: 'start' }}>
          <IlluminatedButton
            label="AVR"
            active={inputs.avrOn}
            inhibited={!outputs.avrArmed}
            onToggle={() => setInput('avrOn', !inputs.avrOn)}
          />
        </div>

        {/* Row 3, col 4: 27 relay reset */}
        <div className="knob-cell" style={{ gridColumn: 4, gridRow: 3, alignSelf: 'start' }}>
          <div className="relay27-section">
            <div className="card">27 RELAY</div>
            <button
              className={`relay27-dome${relay27Tripped ? ' tripped' : ''}`}
              onClick={relay27Tripped ? resetRelay27 : undefined}
              title={relay27Tripped ? '27 relay tripped — click to reset' : '27 relay normal'}
            />
            <span className="relay27-reset-label">RESET</span>
          </div>
        </div>

        {/* Row 1, col 6: load breaker (replaces PositionIndicator; component retained in codebase) */}
        <div className="gauge-col" style={{ gridColumn: 6, gridRow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadBreaker closed={inputs.loadBreaker} rpm={outputs.rpm} vt={outputs.vt} onToggle={setLoadBreaker} />
        </div>

        {/* Row 2, col 6: fine governor speed-changer */}
        <div className="knob-cell" style={{ gridColumn: 6, gridRow: 2, alignSelf: 'start' }}>
          <SpringLoadedSelector
            label="FINE"
            onCommand={setValveCommand}
            readOnly={inputs.governorOn}
            lockLabel={inputs.governorOn ? 'GOV COMMANDING' : undefined}
          />
        </div>

        {/* Row 3, col 6: START/STOP buttons + governor selector stacked */}
        <div
          className="knob-cell"
          style={{ gridColumn: 6, gridRow: 3, alignSelf: 'start', flexDirection: 'column', gap: 12 }}
        >
          <div className="engine-start-stop">
            <div className="card">ENGINE</div>
            <div className="engine-btn-row">
              <button
                className="engine-btn engine-btn-start"
                disabled={engineAtIdle}
                onClick={startEngine}
                title={engineAtIdle ? 'Engine already running' : 'Start engine — ramps to idle'}
              >
                <span className="engine-symbol">I</span>
              </button>
              <button
                className="engine-btn engine-btn-stop"
                disabled={!engineRunning}
                onClick={stopEngine}
                title={!engineRunning ? 'Engine already stopped' : 'Stop engine — opens breaker, cuts fuel'}
              >
                <span className="engine-symbol">O</span>
              </button>
            </div>
          </div>
          <IlluminatedButton
            label="GOVERNOR"
            active={inputs.governorOn}
            inhibited={!outputs.govArmed}
            onToggle={() => setInput('governorOn', !inputs.governorOn)}
          />
        </div>
      </div>

      <p className="footer">PHASE 3D · 400 V · 50 Hz · 1 MVA · ISLANDED · AUTO GOVERNOR + AVR</p>
    </div>
  )
}
