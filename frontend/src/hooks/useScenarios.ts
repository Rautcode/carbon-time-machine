import { useState, useCallback } from 'react'
import { generateScenarios } from '../api/scenarios'
import type { UserProfile, ScenarioResponse } from '../types'

interface UseScenarios {
  data: ScenarioResponse | null
  loading: boolean
  error: string | null
  generate: (profile: UserProfile) => Promise<void>
  reset: () => void
}

export function useScenarios(): UseScenarios {
  const [data, setData] = useState<ScenarioResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (profile: UserProfile) => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateScenarios(profile)
      setData(result)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, generate, reset }
}
