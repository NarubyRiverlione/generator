/** Unit tests for the start-point preset registry. */

import { describe, expect, it } from 'vitest'
import { RPM_RATED, VALVE_RPM_MAX } from '../../constants'
import { initialState } from '../../simulation'
import { BOOT_PRESET, resolvePreset } from '../../presets'

const LIVE_LOADED_VALVE = (0.5 * RPM_RATED / VALVE_RPM_MAX) * 100 // 46.875 %

describe('resolvePreset — known names', () => {
  it('live-loaded resolves to its definition', () => {
    const preset = resolvePreset('live-loaded')
    expect(preset.inputs.fieldVoltage).toBe(1.1)
    expect(preset.inputs.loadFraction).toBe(0.5)
    expect(preset.seed.iField).toBe(1.1)
    expect(preset.seed.omega).toBe(1.0)
    expect(preset.seed.valvePct).toBeCloseTo(LIVE_LOADED_VALVE, 4)
    expect(preset.seed.valveActual).toBeCloseTo(LIVE_LOADED_VALVE, 4)
  })

  it('cold-dark resolves to at-rest seed', () => {
    const preset = resolvePreset('cold-dark')
    expect(preset.seed.omega).toBe(0)
    expect(preset.seed.valveActual).toBe(0)
    expect(preset.seed.valvePct).toBe(0)
    expect(preset.seed.iField).toBe(0)
  })

  it('spinning-dark resolves with empty seed', () => {
    const preset = resolvePreset('spinning-dark')
    expect(Object.keys(preset.seed)).toHaveLength(0)
  })
})

describe('resolvePreset — fallback', () => {
  it('undefined falls back to BOOT_PRESET', () => {
    const fallback = resolvePreset(undefined)
    const boot = resolvePreset(BOOT_PRESET)
    expect(fallback).toBe(boot)
  })

  it('unknown name falls back to BOOT_PRESET', () => {
    const fallback = resolvePreset('does-not-exist')
    const boot = resolvePreset(BOOT_PRESET)
    expect(fallback).toBe(boot)
  })
})

describe('spinning-dark reproduces no-arg initialState() field-for-field', () => {
  it('seeding from spinning-dark gives identical state to no-arg call', () => {
    const preset = resolvePreset('spinning-dark')
    const fromPreset = initialState({ ...preset.inputs } as Parameters<typeof initialState>[0], preset.seed)
    const baseline = initialState()

    expect(fromPreset.iField).toBeCloseTo(baseline.iField, 8)
    expect(fromPreset.exciterLagged).toBeCloseTo(baseline.exciterLagged, 8)
    expect(fromPreset.omega).toBeCloseTo(baseline.omega, 8)
    expect(fromPreset.valvePct).toBeCloseTo(baseline.valvePct, 8)
    expect(fromPreset.valveActual).toBeCloseTo(baseline.valveActual, 8)
    expect(fromPreset.avrIntegral).toBe(baseline.avrIntegral)
    expect(fromPreset.lastValidOutputs.vt).toBeCloseTo(baseline.lastValidOutputs.vt, 8)
    expect(fromPreset.lastValidOutputs.rpm).toBeCloseTo(baseline.lastValidOutputs.rpm, 8)
  })
})

describe('cold-dark produces fully at-rest state', () => {
  it('omega and valve are zero', () => {
    const preset = resolvePreset('cold-dark')
    const state = initialState({ ...preset.inputs } as Parameters<typeof initialState>[0], preset.seed)
    expect(state.omega).toBe(0)
    expect(state.valveActual).toBe(0)
    expect(state.valvePct).toBe(0)
    expect(state.iField).toBe(0)
    expect(state.lastValidOutputs.rpm).toBe(0)
    expect(state.lastValidOutputs.vt).toBe(0)
  })
})
