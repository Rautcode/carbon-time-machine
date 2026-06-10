import { memo, useState, useEffect, useRef, useCallback } from 'react'
import type { ScenarioResponse } from '../../types'
import { fetchLetter } from '../../api/letter'
import type { ScenarioId } from '../../api/letter'

interface Props {
  data: ScenarioResponse
  onClose: () => void
}

// Record<ScenarioId, string> enforces exhaustiveness — TypeScript errors if a new ScenarioId is added
const SCENARIO_LABELS: Record<ScenarioId, string> = {
  committed: 'Committed Future',
  small:     'Small Steps',
  bau:       'Current Path',
}

const SCENARIO_COLORS: Record<ScenarioId, string> = {
  committed: 'text-green-700',
  small:     'text-amber-700',
  bau:       'text-red-700',
}

/** Derive the dominant emission category from a breakdown dict (allowlisted) */
function getDominant(breakdown: Record<string, number>): 'transport' | 'food' | 'energy' | 'shopping' | 'digital' {
  const allowed = ['transport', 'food', 'energy', 'shopping', 'digital'] as const
  const entries = Object.entries(breakdown)
  if (entries.length === 0) return 'energy'
  const key = entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
  return allowed.includes(key as typeof allowed[number]) ? (key as typeof allowed[number]) : 'energy'
}

/**
 * Typewriter hook — reveals `text` character by character at `cps` chars/sec.
 * Resets when `text` changes. Returns the currently-visible portion.
 */
function useTypewriter(text: string, cps = 32): string {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    if (!text) return

    const interval = setInterval(() => {
      indexRef.current += 1
      setDisplayed(text.slice(0, indexRef.current))
      if (indexRef.current >= text.length) clearInterval(interval)
    }, 1000 / cps)

    return () => clearInterval(interval)
  }, [text, cps])

  return displayed
}

type FetchState = 'idle' | 'loading' | 'done' | 'error'

/**
 * LetterModal — full-screen overlay showing an AI-generated letter from 2050.
 * Fetches on open, reveals text with a typewriter animation.
 */
export const LetterModal = memo(({ data, onClose }: Props) => {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('committed')
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [letter, setLetter] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const hasMounted = useRef(false)  // prevents lint warning on intentional mount-only effect

  const displayed = useTypewriter(fetchState === 'done' ? letter : '', 32)
  const isTyping = fetchState === 'done' && displayed !== letter

  const fetchForScenario = useCallback(async (sid: ScenarioId) => {
    setFetchState('loading')
    setLetter('')
    setErrorMsg('')

    // Guard: ensure scenario data exists before building request
    const scenario = data.scenarios.find(s => s.scenario_id === sid)
    if (!scenario) {
      setErrorMsg(`Scenario data for "${SCENARIO_LABELS[sid]}" is not available.`)
      setFetchState('error')
      return
    }

    const finalPoint = scenario.timeline.at(-1)

    try {
      const response = await fetchLetter({
        current_annual_tons: data.current_annual_tons,
        dominant_category:   getDominant(data.breakdown),
        scenario_id:         sid,
        total_savings_tons:  scenario.total_savings_tons,
        final_year_tons:     finalPoint?.annual_emissions_tons ?? data.current_annual_tons,
      })
      setLetter(response.letter)
      setFetchState('done')
    } catch (err) {
      console.error('Letter fetch failed:', err)
      setErrorMsg('Could not generate your letter. Please try again.')
      setFetchState('error')
    }
  }, [data])

  // Auto-fetch on open — mount-only, intentional (fetchForScenario is stable for this data prop)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      fetchForScenario('committed')
    }
  }, [fetchForScenario])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleScenarioChange = (sid: ScenarioId) => {
    setScenarioId(sid)
    fetchForScenario(sid)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Letter from your 2050 self"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl bg-amber-50 flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-50 border-b border-amber-200 px-8 py-5 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl" aria-hidden="true">✉️</span>
                <h2 className="text-xl font-bold text-amber-900">Letter from Your 2050 Self</h2>
              </div>
              <p className="text-xs text-amber-700">
                Opened: <span className={`font-semibold ${SCENARIO_COLORS[scenarioId]}`}>
                  {SCENARIO_LABELS[scenarioId]} path
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close letter"
              className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-200/60 hover:bg-amber-200
                text-amber-800 text-lg flex items-center justify-center
                focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Scenario tabs */}
          <div className="flex gap-2 mt-4" role="tablist">
            {(['committed', 'small', 'bau'] as const).map(sid => (
              <button
                key={sid}
                role="tab"
                aria-selected={scenarioId === sid}
                onClick={() => handleScenarioChange(sid)}
                disabled={fetchState === 'loading'}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  focus:outline-none focus:ring-2 focus:ring-amber-400
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${scenarioId === sid
                    ? 'bg-amber-800 text-amber-50 border-amber-800'
                    : 'bg-white/60 text-amber-800 border-amber-300 hover:bg-amber-100'
                  }`}
              >
                {SCENARIO_LABELS[sid]}
              </button>
            ))}
          </div>
        </div>

        {/* Letter body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {fetchState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 text-amber-700 gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-sm">Writing your letter from 2050…</p>
            </div>
          )}

          {fetchState === 'error' && (
            <div className="text-center py-12">
              <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
              <button
                onClick={() => fetchForScenario(scenarioId)}
                className="px-4 py-2 bg-amber-700 text-white rounded-full text-sm font-medium
                  hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                Try again
              </button>
            </div>
          )}

          {fetchState === 'done' && (
            <div className="text-amber-950 leading-8 text-[15px] font-serif">
              {displayed.split('\n\n').map((para, i) => (
                <p key={i} className="mb-5 last:mb-0 whitespace-pre-wrap">{para}</p>
              ))}
              {isTyping && (
                <span className="inline-block w-0.5 h-4 bg-amber-700 animate-pulse ml-0.5" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {fetchState === 'done' && !isTyping && (
          <div className="border-t border-amber-200 bg-amber-50 px-8 py-4 flex-shrink-0 text-center">
            <p className="text-xs text-amber-600 italic">
              Generated by AI · Your choices today write this story
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

LetterModal.displayName = 'LetterModal'
