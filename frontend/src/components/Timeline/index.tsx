import { memo } from 'react'
import type { FutureScenario } from '../../types'
import { formatINR, formatTons, formatNumber, emissionColor, scenarioGradient } from '../../utils/formatters'

interface Props {
  scenario: FutureScenario
  isActive: boolean
}

const YEAR_ICONS: Record<number, string> = { 2030: '🌱', 2035: '🌿', 2040: '🌳' }

export const Timeline = memo(({ scenario, isActive }: Props) => {
  if (!isActive) return null

  return (
    <section
      aria-label={`Timeline for ${scenario.label}`}
      className="animate-slide-up"
    >
      {/* Scenario summary banner */}
      {scenario.changes.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Changes made in this scenario:</h3>
          <ul className="flex flex-wrap gap-2" aria-label="Lifestyle changes">
            {scenario.changes.map((change) => (
              <li key={change} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                ✓ {change}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-green-700 italic">&ldquo;{scenario.summary}&rdquo;</p>
        </div>
      )}

      {/* Timeline cards */}
      <ol className="relative" aria-label="Future timeline">
        {/* Vertical line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-red-300 via-yellow-300 to-green-400" aria-hidden="true" />

        {scenario.timeline.map((point, idx) => (
          <li
            key={point.year}
            className="relative pl-16 pb-8 last:pb-0"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* Year bubble */}
            <div
              className="absolute left-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-md bg-white border-2 border-gray-200"
              aria-hidden="true"
            >
              {YEAR_ICONS[point.year] ?? '📅'}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <h4 className="text-xl font-bold text-gray-800 mb-3">{point.year}</h4>

              {/* Stats grid */}
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <dt className="text-xs text-gray-500 mb-1">Annual CO₂</dt>
                  <dd className={`text-lg font-bold ${emissionColor(point.annual_emissions_tons)}`}>
                    {formatTons(point.annual_emissions_tons)}
                  </dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <dt className="text-xs text-gray-500 mb-1">Cumulative</dt>
                  <dd className="text-lg font-bold text-gray-700">
                    {formatTons(point.cumulative_emissions_tons)}
                  </dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <dt className="text-xs text-gray-500 mb-1">Trees needed</dt>
                  <dd className="text-lg font-bold text-green-700">
                    {formatNumber(point.equivalent_trees)}
                  </dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <dt className="text-xs text-gray-500 mb-1">Annual cost</dt>
                  <dd className="text-lg font-bold text-blue-700">
                    {formatINR(point.financial_cost_inr)}
                  </dd>
                </div>
              </dl>

              {/* AI narrative */}
              <blockquote className="border-l-4 border-green-400 pl-4 italic text-sm text-gray-600">
                {point.narrative}
              </blockquote>
            </div>
          </li>
        ))}
      </ol>

      {/* Savings banner */}
      {scenario.total_savings_tons > 0 && (
        <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center shadow-lg">
          <p className="text-sm font-medium opacity-90">By 2040 you save</p>
          <p className="text-3xl font-bold mt-1">
            {scenario.total_savings_tons.toFixed(1)} tons CO₂
          </p>
          <p className="text-sm opacity-90 mt-1">
            + {formatINR(scenario.total_savings_inr)} in your pocket
          </p>
        </div>
      )}
    </section>
  )
})

Timeline.displayName = 'Timeline'
