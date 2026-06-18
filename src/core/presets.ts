/** Named start-point presets — each seeds inputs and settled dynamic state. */

import { DEFAULT_INPUTS, RPM_RATED, VALVE_RPM_MAX } from './constants'
import type { Inputs, SimState } from './types'

export type StartPreset = {
  inputs: Partial<Inputs>
  seed: Partial<SimState>
}

export type PresetName = 'cold-dark' | 'spinning-dark' | 'live-loaded'

// Shipped default start point — trivially overridden by changing this one line.
export const BOOT_PRESET: PresetName = 'cold-dark'

// Default boot values (mirrors simulation.ts internal constants).
const VALVE_PCT_INIT = (1495 / VALVE_RPM_MAX) * 100 // ≈ 93.44 %
const SPEED_INIT_PU = 1495 / RPM_RATED // ≈ 0.9967

const PRESETS: Record<PresetName, StartPreset> = {
  // Deliberate change from today: fully at rest — natural Phase 3a run-up start.
  'cold-dark': {
    inputs: { ...DEFAULT_INPUTS },
    seed: { iField: 0, exciterLagged: 0, omega: 0, valvePct: 0, valveActual: 0 },
  },

  // Today's literal boot preserved as the regression anchor: shaft pre-spun, zero field.
  'spinning-dark': {
    inputs: { ...DEFAULT_INPUTS },
    seed: {},
  },

  // Settled islanded operating point: field up, near-synchronous, 0.5 pu load @ 0.85 pf lag.
  'live-loaded': {
    inputs: {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.1,
      loadFraction: 0.5,
      powerFactor: 0.85,
      pfLag: true,
      avrOn: false,
    },
    seed: {
      iField: 1.1,
      exciterLagged: 1.1,
      omega: SPEED_INIT_PU,
      valvePct: VALVE_PCT_INIT,
      valveActual: VALVE_PCT_INIT,
      avrIntegral: 0,
    },
  },
}

export function resolvePreset(name?: string): StartPreset {
  if (name !== undefined && name in PRESETS) {
    return PRESETS[name as PresetName]
  }
  return PRESETS[BOOT_PRESET]
}
