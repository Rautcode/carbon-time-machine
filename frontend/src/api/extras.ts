import axios from 'axios'
import type { ClimateContext, ScenarioResponse, TipsResponse } from '../types'

/** Shared Axios instance for extras API — 30 s timeout (tips/climate are fast) */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

/**
 * POST /api/tips
 * Requests 5 personalised CO₂ reduction tips from Gemini, ranked by the
 * user's highest-emission categories.
 *
 * @param current_annual_tons - User's total annual footprint in tons CO₂e
 * @param breakdown - Per-category breakdown (transport, food, energy, shopping, digital)
 * @throws {AxiosError} on network failure or non-2xx response
 */
export async function fetchTips(
  current_annual_tons: number,
  breakdown: ScenarioResponse['breakdown'],
): Promise<TipsResponse> {
  const { data } = await api.post<TipsResponse>('/tips', { current_annual_tons, breakdown })
  return data
}

/**
 * GET /api/climate
 * Returns live climate context: current temperature (Open-Meteo),
 * IPCC global anomaly, and atmospheric CO₂ ppm.
 */
export async function fetchClimate(): Promise<ClimateContext> {
  const { data } = await api.get<ClimateContext>('/climate')
  return data
}
