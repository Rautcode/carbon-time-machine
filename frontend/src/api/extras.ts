import axios from 'axios'
import type { ClimateContext, ScenarioResponse, TipsResponse } from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

export async function fetchTips(
  current_annual_tons: number,
  breakdown: ScenarioResponse['breakdown'],
): Promise<TipsResponse> {
  const { data } = await api.post<TipsResponse>('/tips', { current_annual_tons, breakdown })
  return data
}

export async function fetchClimate(): Promise<ClimateContext> {
  const { data } = await api.get<ClimateContext>('/climate')
  return data
}
