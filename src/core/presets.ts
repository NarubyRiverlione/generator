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

  // Settled islanded operating point: synchronous speed, valve trimmed so Pm = Pe = 0.5 pu,
  // field up, 0.5 pu load @ 0.85 pf lag, AVR and governor off.
  'live-loaded': {
    inputs: {
      ...DEFAULT_INPUTS,
      fieldVoltage: 1.1,
      loadFraction: 0.5,
      powerFactor: 0.85,
      pfLag: true,
      avrOn: false,
      governorOn: false,
    },
    seed: {
      iField: 1.1,
      exciterLagged: 1.1,
      omega: 1.0,
      // valve trimmed so Pm = (valveActual/100) * PM_MAX = 0.5 pu
      valvePct: (0.5 * RPM_RATED / VALVE_RPM_MAX) * 100,   // 46.875 %
      valveActual: (0.5 * RPM_RATED / VALVE_RPM_MAX) * 100,
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
