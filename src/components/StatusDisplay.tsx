/** LCD screen, fault screen, and reference sticky note — all in one bezel. */

import { useState } from 'react'
import { puToKVAR, puToVolts } from '../core/units'
import type { Outputs } from '../core/types'

const DEG = 180 / Math.PI

// Thresholds replaced by a proper enum in Phase 4a.
// IDLE: machine spinning but below operating speed.
// RUNNING: at or near rated speed — load breaker available.
type EngineStatus = 'STOPPED' | 'IDLE' | 'RUNNING'

const RUNNING_RPM = 1450

function deriveEngineStatus(rpm: number): EngineStatus {
  if (rpm < 30) return 'STOPPED'
  if (rpm >= RUNNING_RPM) return 'RUNNING'
  return 'IDLE'
}

type FaultLevel = 'ok' | 'warn' | 'danger' | 'fault'

function faultLevel(relay27Tripped: boolean, stabilityMargin: number): FaultLevel {
  if (relay27Tripped) return 'fault'
  if (stabilityMargin < 0.08) return 'danger'
  if (stabilityMargin < 0.2) return 'warn'
  return 'ok'
}

type Props = { outputs: Outputs; relay27Tripped: boolean }

export function StatusDisplay({ outputs, relay27Tripped }: Props) {
  const [showNote, setShowNote] = useState(false)

  const vtV = puToVolts(outputs.vt)
  const qKVAR = puToKVAR(outputs.q)
  const deltaDegs = outputs.delta * DEG
  const satPct = Math.round(outputs.saturationFactor * 100)
  const powerBalanceRaw = (outputs.pm - outputs.p) * 100 // (Pm - Pe) × 100 %
  const powerBalancePct = powerBalanceRaw.toFixed(1)
  const throttlePct = outputs.valveActual.toFixed(1)
  const dampingSign = outputs.dampingTorque >= 0 ? '+' : ''
  const dampingDisplay = `${dampingSign}${outputs.dampingTorque.toFixed(3)}`
  const marginPct = Math.round(outputs.stabilityMargin * 100)
  const marginWarn = outputs.stabilityMargin < 0.2
  const marginRed = outputs.stabilityMargin < 0.08
  // Hz is a property of the electrical output — only show it when Vt is present.
  const freqDisplay = outputs.vt > 0.01 ? `${outputs.frequencyHz.toFixed(1)} Hz` : '---'

  const level = faultLevel(relay27Tripped, outputs.stabilityMargin)
  const engineStatus = deriveEngineStatus(outputs.rpm)

  return (
    <div className="lcd-mod">
      {/* ── Primary measurement screen ── */}
      <div className="screen">
        <div className="l1">
          <span>Vt {vtV.toFixed(0)} V</span>
          <span>{Math.round(outputs.rpm)} rpm</span>
        </div>
        <div className={`l1 engine-status engine-status--${engineStatus.toLowerCase()}`}>
          <span>ENG</span>
          <span>{engineStatus}</span>
        </div>
        <div className="l2">
          <span>δ {deltaDegs.toFixed(1)}°</span>
          <span>f {freqDisplay}</span>
        </div>
        <div className="l3">
          <span>
            Q {outputs.q >= 0 ? '+' : ''}
            {qKVAR.toFixed(0)} kVAR
          </span>
          <span>
            ΔP {powerBalanceRaw > 0 ? '+' : ''}
            {powerBalancePct}%
          </span>
        </div>
        <div className={`l4 ${marginRed ? 'warn-red' : marginWarn ? 'warn-amber' : ''}`}>
          <span>
            VSM {marginPct}%{marginWarn ? ' ⚠' : ''}
          </span>
          <span>SAT {satPct}%</span>
        </div>
        <div className="l4">
          <span>THR {throttlePct}%</span>
          <span>DMP {dampingDisplay}</span>
        </div>
      </div>

      {/* ── Bottom section: fault screen + sticky note overlaid in same space ── */}
      <div className="lcd-bottom">
        <div className={`screen screen-fault screen-fault--${level}`}>
          {level === 'fault' && (
            <>
              <div className="l1">
                <span>⚠ 27 RELAY TRIP</span>
              </div>
              <div className="l2">
                <span>UNDER-VOLTAGE</span>
              </div>
              <div className="l3">
                <span>LOAD DISCONNECTED</span>
              </div>
            </>
          )}
          {level === 'danger' && (
            <>
              <div className="l1">
                <span>⚠ STABILITY DANGER</span>
              </div>
              <div className="l2">
                <span>VSM {marginPct}% — NEAR COLLAPSE</span>
              </div>
            </>
          )}
          {level === 'warn' && (
            <>
              <div className="l1">
                <span>⚠ STABILITY WARNING</span>
              </div>
              <div className="l2">
                <span>VSM {marginPct}% — MARGIN LOW</span>
              </div>
            </>
          )}
          {level === 'ok' && (
            <div className="l1 fault-ok">
              <span>ALL CLEAR</span>
            </div>
          )}
        </div>

        {showNote && (
          <div className="sticky-note">
            <div className="sticky-tape" onClick={() => setShowNote(false)} title="Close" />
            <div className="sticky-line">
              <span className="sticky-key">Vt</span> Terminal voltage (rated 400 V)
            </div>
            <div className="sticky-line">
              <span className="sticky-key">rpm</span> Shaft speed (1500 = rated); Hz = rpm / 30
            </div>
            <div className="sticky-line">
              <span className="sticky-key">f</span> Output frequency — governed by turbine valve
            </div>
            <div className="sticky-line">
              <span className="sticky-key">δ</span> Load angle (classical limit ≈ 90° at unity PF)
            </div>
            <div className="sticky-line">
              <span className="sticky-key">Q</span> Reactive power — + supplying, − absorbing
            </div>
            <div className="sticky-line">
              <span className="sticky-key">SAT</span> Saturation derate — 100 % unsaturated; &lt;100 % when field pushed
              above the knee
            </div>
            <div className="sticky-line">
              <span className="sticky-key">ΔP</span> Power balance (Pm − Pe) — positive accelerates the rotor, negative
              decelerates; zero holds frequency
            </div>
            <div className="sticky-line">
              <span className="sticky-key">VSM</span> Voltage stability margin — warn &lt;20%, danger &lt;8%
            </div>
            <div className="sticky-line">
              <span className="sticky-key">ENG</span> Engine state — STOPPED (shaft at rest), IDLE (spinning, below 1450 rpm),
              RUNNING (≥ 1450 rpm — load breaker available near 1500)
            </div>
            <div className="sticky-line">
              <span className="sticky-key">THR</span> Throttle / fuel rack position (%) — physical valve actual; governor
              drives this toward the demand
            </div>
            <div className="sticky-line">
              <span className="sticky-key">DMP</span> Damping torque D·(ω−ωref) pu — zero at synchronous speed; spikes
              transiently on load steps; passive, no control loop
            </div>
          </div>
        )}
      </div>

      <div className="lcd-toolbar">
        <button
          className={`info-btn${showNote ? ' active' : ''}`}
          onClick={() => setShowNote((v) => !v)}
          title={showNote ? 'Hide legend' : 'Show legend'}
          aria-pressed={showNote}
        >
          ℹ
        </button>
      </div>
    </div>
  )
}
