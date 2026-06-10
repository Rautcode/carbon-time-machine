import axios from 'axios'

/** Scenario IDs accepted by the letter endpoint */
export type ScenarioId = 'committed' | 'small' | 'bau'

/** Dominant emission category — must match the backend Literal allowlist */
export type DominantCategory = 'transport' | 'food' | 'energy' | 'shopping' | 'digital'

export interface LetterRequest {
  current_annual_tons: number
  dominant_category: DominantCategory
  scenario_id: ScenarioId
  total_savings_tons: number
  final_year_tons: number
}

export interface LetterResponse {
  letter: string
  scenario_id: ScenarioId
  generated_at: string
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,   // Gemini flash is fast; 30 s is generous
})

/**
 * POST /api/letter
 * Generate a personal letter from the user's 2050 self via Gemini AI.
 *
 * @param body - Profile + scenario data for personalisation
 * @throws {AxiosError} on network failure or non-2xx response
 */
export async function fetchLetter(body: LetterRequest): Promise<LetterResponse> {
  const { data } = await api.post<LetterResponse>('/letter', body)
  return data
}
