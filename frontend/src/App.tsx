import { useCallback, useEffect, useRef } from 'react'
import { InputForm } from './components/InputForm'
import { FutureComparison } from './components/FutureComparison'
import { LoadingSpinner } from './components/shared/LoadingSpinner'
import { ErrorMessage } from './components/shared/ErrorMessage'
import { useScenarios } from './hooks/useScenarios'
import type { UserProfile } from './types'

export default function App() {
  const { data, loading, error, generate, reset } = useScenarios()
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleSubmit = useCallback(
    (profile: UserProfile) => { void generate(profile) },
    [generate],
  )

  useEffect(() => {
    if (data && resultsRef.current) {
      resultsRef.current.focus()
    }
  }, [data])

  const step = loading ? 'loading' : data ? 'results' : 'input'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 relative">

      {/* ── Ambient floating blobs (decorative, aria-hidden) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-green-200/50 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-teal-200/40 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-0 left-1/2 w-96 h-64 bg-emerald-200/35 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-2/3 left-1/4 w-48 h-48 bg-cyan-100/40 rounded-full blur-2xl animate-float" style={{ animationDelay: '3.5s' }} />
      </div>

      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Animated earth icon */}
          <div className="relative w-9 h-9 flex-shrink-0" aria-hidden="true">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-green-500" />
            <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-green-600 to-emerald-400 opacity-80" />
            <div className="absolute inset-0 rounded-full border-2 border-green-300/50 animate-orbit" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gradient leading-tight">
              Carbon Time Machine
            </h1>
            <p className="text-xs text-gray-500">See the future your lifestyle creates</p>
          </div>

          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-1.5" aria-label="Progress steps">
            {(() => {
              const steps = ['input', 'loading', 'results'] as const
              const stepIndex = steps.indexOf(step)
              return steps.map((s, i) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    step === s ? 'bg-green-600 scale-125' : i < stepIndex ? 'bg-green-300' : 'bg-gray-200'
                  }`}
                  aria-hidden="true"
                />
              ))
            })()}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-8" tabIndex={-1}>

        {step === 'input' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-4">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">AI-Powered Carbon Analysis</span>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                What does your{' '}
                <span className="text-gradient">2040</span>{' '}
                look like?
              </h2>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Enter your lifestyle habits — AI will project your environmental and
                financial future across three different paths.
              </p>
            </div>
            <InputForm onSubmit={handleSubmit} loading={loading} />
          </div>
        )}

        {step === 'loading' && <LoadingSpinner />}

        {step === 'results' && error && (
          <ErrorMessage message={error} onRetry={reset} />
        )}

        {step === 'results' && data && !error && (
          <div ref={resultsRef} tabIndex={-1} className="outline-none">
            <FutureComparison data={data} onReset={reset} />
          </div>
        )}

        {error && step === 'input' && (
          <ErrorMessage message={error} onRetry={reset} />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-8 text-xs text-gray-500">
        <p>
          Emission factors: IPCC AR6 · India CEA 2023 · DEFRA 2023 · IEA 2023 ·
          Built for <span className="text-green-600 font-medium">#BuildwithAI Challenge 3</span>
        </p>
      </footer>
    </div>
  )
}
