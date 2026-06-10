import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScenarios } from '../hooks/useScenarios'
import * as api from '../api/scenarios'
import type { ScenarioResponse } from '../types'

const MOCK_RESPONSE: ScenarioResponse = {
  current_annual_tons: 4.5,
  breakdown: { transport: 2.0, food: 1.5, energy: 0.7, shopping: 0.3, digital: 0 },
  scenarios: [],
  generated_at: '2025-01-01T00:00:00Z',
}

const MOCK_PROFILE = {
  car_km_per_week: 100,
  domestic_flights_per_year: 2,
  international_flights_per_year: 0,
  public_transport_km_per_week: 20,
  diet_type: 'meat_moderate' as const,
  local_food_percent: 20,
  monthly_electricity_kwh: 300,
  renewable_energy_percent: 5,
  home_size_sqft: 1000,
  new_clothing_items_per_year: 15,
  new_electronics_per_year: 2,
  streaming_hours_per_week: 0,
  online_orders_per_month: 0,
}

describe('useScenarios', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with null data, no loading, no error', () => {
    const { result } = renderHook(() => useScenarios())
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets loading=true while generating', async () => {
    vi.spyOn(api, 'generateScenarios').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(MOCK_RESPONSE), 100)),
    )
    const { result } = renderHook(() => useScenarios())
    act(() => { void result.current.generate(MOCK_PROFILE) })
    expect(result.current.loading).toBe(true)
  })

  it('sets data on success', async () => {
    vi.spyOn(api, 'generateScenarios').mockResolvedValue(MOCK_RESPONSE)
    const { result } = renderHook(() => useScenarios())
    await act(async () => { await result.current.generate(MOCK_PROFILE) })
    expect(result.current.data).toEqual(MOCK_RESPONSE)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets error on failure', async () => {
    vi.spyOn(api, 'generateScenarios').mockRejectedValue(new Error('API error'))
    const { result } = renderHook(() => useScenarios())
    await act(async () => { await result.current.generate(MOCK_PROFILE) })
    expect(result.current.error).toBe('API error')
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('resets all state on reset()', async () => {
    vi.spyOn(api, 'generateScenarios').mockResolvedValue(MOCK_RESPONSE)
    const { result } = renderHook(() => useScenarios())
    await act(async () => { await result.current.generate(MOCK_PROFILE) })
    act(() => { result.current.reset() })
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('handles non-Error rejection with fallback message', async () => {
    vi.spyOn(api, 'generateScenarios').mockRejectedValue('string error')
    const { result } = renderHook(() => useScenarios())
    await act(async () => { await result.current.generate(MOCK_PROFILE) })
    expect(result.current.error).toBeTruthy()
  })
})
