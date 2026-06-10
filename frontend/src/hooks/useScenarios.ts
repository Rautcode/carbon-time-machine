import { useState, useCallback } from 'react'
import { generateScenarios } from '../api/scenarios'
import type { UserProfile, ScenarioResponse } from '../types'

/** Shape returned by the useScenarios hook */
interface UseScenarios {
  /** Generated scenario response, or null before first successful call */
  data: ScenarioResponse | null
  /** True while the API call is in flight */
  loading: boolean
  /** Human-readable error message, or null when no error */
  error: string | null
  /** Trigger scenario generation from a user profile */
  generate: (profile: UserProfile) => Promise<void>
  /** Clear all state and return to the input step */
  reset: () => void
}

/**
 * Manages the full lifecycle of scenario generation:
 * idle → loading → (data | error) → reset → idle.
 *
 * Errors from non-Error rejections are normalised to a fallback string
 * so callers always receive a displayable message.
 */
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
