import axios from 'axios'
import type { UserProfile, ScenarioResponse } from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
})

export async function generateScenarios(profile: UserProfile): Promise<ScenarioResponse> {
  const { data } = await api.post<ScenarioResponse>('/scenarios', profile)
  return data
}

export async function checkHealth(): Promise<boolean> {
  try {
    await api.get('/health')
    return true
  } catch {
    return false
  }
}
