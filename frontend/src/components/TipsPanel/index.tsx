import { memo, useState } from 'react'
import { fetchTips } from '../../api/extras'
import type { CarbonTip, ScenarioResponse } from '../../types'

interface Props {
  currentAnnualTons: number
  breakdown: ScenarioResponse['breakdown']
}

const CATEGORY_STYLE: Record<string, { bg: string; border: string; icon: string }> = {
  transport: { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: '🚗' },
  food:      { bg: 'bg-orange-50', border: 'border-orange-200', icon: '🍽️' },
  energy:    { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '⚡' },
  shopping:  { bg: 'bg-purple-50', border: 'border-purple-200', icon: '🛍️' },
  digital:   { bg: 'bg-teal-50',   border: 'border-teal-200',   icon: '📱' },
}

function TipCard({ tip }: { tip: CarbonTip }) {
  const style = CATEGORY_STYLE[tip.category] ?? CATEGORY_STYLE.transport
  const savedTons = (tip.estimated_savings_kg / 1000).toFixed(2)
  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-4 flex gap-3`}>
      <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-snug mb-1">{tip.title}</p>
        <p className="text-xs text-gray-600 leading-relaxed">{tip.description}</p>
        {tip.estimated_savings_kg > 0 && (
          <p className="mt-2 text-xs font-bold text-green-700">
            Saves ~{savedTons} t CO₂/year
          </p>
        )}
      </div>
    </div>
  )
}

export const TipsPanel = memo(({ currentAnnualTons, breakdown }: Props) => {
  const [tips, setTips] = useState<CarbonTip[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchTips(currentAnnualTons, breakdown)
      setTips(res.tips)
    } catch {
      setError('Could not load tips. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!tips && !loading) {
    return (
      <div className="text-center py-6">
        <button
          onClick={handleFetch}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500
            hover:from-teal-600 hover:to-green-600 text-white font-semibold rounded-2xl
            shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all
            focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
          aria-label="Get personalised AI carbon reduction tips"
        >
          <span aria-hidden="true">🤖</span>
          Get AI Reduction Tips
        </button>
        <p className="mt-2 text-xs text-gray-400">Personalised by Gemini AI for your profile</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-8 text-gray-500 text-sm">
        <span
          className="h-5 w-5 rounded-full border-2 border-teal-400 border-t-transparent animate-spin"
          aria-hidden="true"
        />
        Gemini is analysing your footprint…
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={handleFetch}
          className="text-xs text-teal-600 underline hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <section aria-label="AI carbon reduction tips" className="animate-fade-in">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
        <span aria-hidden="true">🤖</span> AI Reduction Tips
        <span className="text-xs font-normal text-gray-400 normal-case tracking-normal">
          — personalised for your footprint
        </span>
      </h3>
      <div className="space-y-3">
        {(tips ?? []).map((tip, i) => (
          <TipCard key={`${tip.category}-${i}`} tip={tip} />
        ))}
      </div>
    </section>
  )
})

TipsPanel.displayName = 'TipsPanel'
