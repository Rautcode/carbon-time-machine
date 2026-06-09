import { useCallback } from 'react'
import { InputForm } from './components/InputForm'
import { FutureComparison } from './components/FutureComparison'
import { LoadingSpinner } from './components/shared/LoadingSpinner'
import { ErrorMessage } from './components/shared/ErrorMessage'
import { useScenarios } from './hooks/useScenarios'
import type { UserProfile } from './types'

export default function App() {
  const { data, loading, error, generate, reset } = useScenarios()

  const handleSubmit = useCallback(
    (profile: UserProfile) => { void generate(profile) },
    [generate],
  )

  const step = loading ? 'loading' : data ? 'results' : 'input'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">🌍</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Carbon Time Machine</h1>
            <p className="text-xs text-gray-500">See the future your lifestyle creates</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-8" tabIndex={-1}>
        {step === 'input' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                What does your 2040 look like?
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Enter your lifestyle habits and AI will project your environmental and financial
                future across three different paths.
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
          <FutureComparison data={data} onReset={reset} />
        )}

        {error && step === 'input' && (
          <ErrorMessage message={error} onRetry={reset} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        <p>
          Emission factors from IPCC AR6 &amp; India CEA 2023 · Built for #BuildwithAI Challenge 3
        </p>
      </footer>
    </div>
  )
}
