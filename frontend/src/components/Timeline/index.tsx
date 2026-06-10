import { memo } from 'react'
import type { FutureScenario } from '../../types'
import { formatINR, formatTons, formatNumber, emissionColor } from '../../utils/formatters'

interface Props {
  scenario: FutureScenario
  isActive: boolean
}

/** Paris Agreement 1.5°C per-capita annual budget (tons CO₂e) */
const PARIS_LIMIT_TONS = 2.0

/** Tons of CO₂ absorbed by one mature tree per year (USDA Forest Service) */
const TREE_SEQUESTRATION_TONS = 0.021

const YEAR_CONFIG: Record<number, { icon: string; ring: string; borderLeft: string; glow: string }> = {
  2030: { icon: '🌱', ring: 'border-orange-400', borderLeft: 'border-l-orange-400', glow: 'shadow-orange-100' },
  2035: { icon: '🌿', ring: 'border-yellow-400', borderLeft: 'border-l-yellow-400', glow: 'shadow-yellow-100' },
  2040: { icon: '🌳', ring: 'border-green-400',  borderLeft: 'border-l-green-400',  glow: 'shadow-green-100'  },
}

export const Timeline = memo(({ scenario, isActive }: Props) => {
  if (!isActive) return null

  return (
    <section aria-label={`Timeline for ${scenario.label}`} className="animate-slide-up">

      {/* Changes banner */}
      {scenario.changes.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2">
            Lifestyle changes in this scenario
          </h3>
          <ul className="flex flex-wrap gap-2" aria-label="Lifestyle changes">
            {scenario.changes.map((change) => (
              <li key={change} className="text-xs bg-white border border-green-200 text-green-700 px-3 py-1 rounded-full font-medium shadow-sm">
                ✓ {change}
              </li>
            ))}
          </ul>
          {scenario.summary && (
            <p className="mt-3 text-sm text-green-700 italic leading-relaxed">
              &ldquo;{scenario.summary}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Vertical timeline */}
      <div className="relative">
        {/* Connector line — outside <ol> to keep valid HTML (only <li> allowed as ol children) */}
        <div
          className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-orange-300 via-yellow-300 to-green-400"
          aria-hidden="true"
        />
      <ol className="relative" aria-label="Future timeline">

        {scenario.timeline.map((point, idx) => {
          const cfg = YEAR_CONFIG[point.year] ?? { icon: '📅', ring: 'border-gray-300', borderLeft: 'border-l-gray-300', glow: '' }
          return (
            <li
              key={point.year}
              className="relative pl-16 pb-7 last:pb-0 timeline-card"
              style={{ animationDelay: `${idx * 0.12}s` }}
            >
              {/* Year bubble */}
              <div
                className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center
                  text-xl bg-white border-2 ${cfg.ring} shadow-md ${cfg.glow}`}
                aria-hidden="true"
              >
                {cfg.icon}
              </div>

              {/* Card */}
              <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm p-5
                hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
                border-l-4 ${cfg.borderLeft}`}>

                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-2xl font-extrabold text-gray-800">{point.year}</h4>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full bg-gray-50 ${emissionColor(point.annual_emissions_tons)}`}>
                    {formatTons(point.annual_emissions_tons)} / yr
                  </span>
                </div>

                {/* Stats grid */}
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-3 text-center border border-orange-100">
                    <dt className="text-xs text-gray-500 mb-0.5">Cumulative</dt>
                    <dd className="text-base font-bold text-orange-700">
                      {formatTons(point.cumulative_emissions_tons)}
                    </dd>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center border border-green-100">
                    <dt className="text-xs text-gray-500 mb-0.5">Trees needed</dt>
                    <dd className="text-base font-bold text-green-700">
                      {formatNumber(point.equivalent_trees)}
                    </dd>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 text-center border border-blue-100">
                    <dt className="text-xs text-gray-500 mb-0.5">Annual cost</dt>
                    <dd className="text-base font-bold text-blue-700">
                      {formatINR(point.financial_cost_inr)}
                    </dd>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center border border-purple-100">
                    <dt className="text-xs text-gray-500 mb-0.5">vs 1.5°C limit</dt>
                    <dd className={`text-base font-bold ${point.annual_emissions_tons <= PARIS_LIMIT_TONS ? 'text-green-700' : 'text-red-600'}`}>
                      {point.annual_emissions_tons <= PARIS_LIMIT_TONS ? '✓ On track' : `+${(point.annual_emissions_tons - PARIS_LIMIT_TONS).toFixed(1)}t`}
                    </dd>
                  </div>
                </dl>

                {/* AI narrative */}
                <blockquote className="border-l-4 border-green-300 pl-4 italic text-sm text-gray-600 leading-relaxed bg-green-50/50 py-2 rounded-r-lg">
                  {point.narrative}
                </blockquote>
              </div>
            </li>
          )
        })}
      </ol>
      </div>{/* end relative wrapper */}

      {/* Savings banner */}
      {scenario.total_savings_tons > 0 && (
        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white text-center shadow-xl animate-count-in">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">By 2040 you save</p>
          <p className="text-4xl font-extrabold">{scenario.total_savings_tons.toFixed(1)} tons CO₂</p>
          <p className="text-sm opacity-90 mt-1">
            + {formatINR(scenario.total_savings_inr)} stays in your pocket
          </p>
          <p className="text-xs opacity-70 mt-2">
            Equivalent to planting {Math.round(scenario.total_savings_tons / TREE_SEQUESTRATION_TONS).toLocaleString()} trees
          </p>
        </div>
      )}
    </section>
  )
})

Timeline.displayName = 'Timeline'
