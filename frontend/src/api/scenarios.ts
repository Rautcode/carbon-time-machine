import axios from 'axios'
import type { UserProfile, ScenarioResponse } from '../types'

/** Shared Axios instance for the scenarios API — 60 s timeout for AI generation */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
})

/**
 * POST /api/scenarios
 * Sends a user profile to the backend and returns three future scenario
 * projections (BAU, Small Steps, Committed) with AI-generated narratives.
 *
 * @throws {AxiosError} on network failure or non-2xx response
 */
export async function generateScenarios(profile: UserProfile): Promise<ScenarioResponse> {
  const { data } = await api.post<ScenarioResponse>('/scenarios', profile)
  return data
}

/**
 * GET /api/health
 * Lightweight liveness probe — returns true if the backend is reachable.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    await api.get('/health')
    return true
  } catch {
    return false
  }
}
