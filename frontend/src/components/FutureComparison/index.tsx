import { memo, useState } from 'react'
import type { ScenarioResponse } from '../../types'
import { Timeline } from '../Timeline'
import { formatINR, formatTons, breakdownPercent, scenarioGradient } from '../../utils/formatters'

interface Props {
  data: ScenarioResponse
  onReset: () => void
}

const SCENARIO_ICONS: Record<string, string> = {
  bau: '📈',
  small: '🚶',
  committed: '🌿',
}

const BAR_COLORS: Record<string, string> = {
  transport: 'bg-blue-500',
  food: 'bg-orange-500',
  energy: 'bg-yellow-500',
  shopping: 'bg-purple-500',
}

export const FutureComparison = memo(({ data, onReset }: Props) => {
  const [activeScenario, setActiveScenario] = useState('bau')
  const total = data.current_annual_tons

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Environmental Future</h2>
        <p className="text-gray-700 mt-1">
          Based on <strong>{total.toFixed(1)} tons CO₂/year</strong> current footprint
        </p>
      </div>

      {/* Footprint breakdown */}
      <section
        aria-label="Current footprint breakdown"
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
      >
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Current Footprint Breakdown
        </h3>
        <dl className="space-y-3">
          {(
            Object.entries(data.breakdown) as [keyof typeof data.breakdown, number][]
          ).map(([key, val]) => {
            const pct = breakdownPercent(val, total)
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <dt className="capitalize text-gray-700 font-medium">{key}</dt>
                  <dd className="text-gray-600">
                    {formatTons(val)} ({pct}%)
                  </dd>
                </div>
                <div
                  className="h-3 bg-gray-100 rounded-full overflow-hidden"
                  role="presentation"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${BAR_COLORS[key] ?? 'bg-gray-500'}`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${key} ${pct}% of total`}
                  />
                </div>
              </div>
            )
          })}
        </dl>
      </section>

      {/* Scenario tabs */}
      <section aria-label="Future scenarios">
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          Choose a Future Path
        </h3>

        <div
          role="tablist"
          aria-label="Select future scenario"
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {data.scenarios.map((s) => (
            <button
              key={s.scenario_id}
              role="tab"
              aria-selected={activeScenario === s.scenario_id}
              aria-controls={`panel-${s.scenario_id}`}
              id={`tab-${s.scenario_id}`}
              onClick={() => setActiveScenario(s.scenario_id)}
              className={`rounded-xl border-2 p-4 text-left transition-all
                focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1
                ${
                  activeScenario === s.scenario_id
                    ? 'border-green-500 shadow-md scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                } bg-gradient-to-br ${scenarioGradient(s.scenario_id)}`}
            >
              <div className="text-2xl mb-2" aria-hidden="true">
                {SCENARIO_ICONS[s.scenario_id]}
              </div>
              <div className="text-sm font-bold text-gray-800">{s.label}</div>
              {s.total_savings_tons > 0 && (
                <div className="text-xs text-green-700 mt-1 font-medium">
                  Save {s.total_savings_tons.toFixed(1)}t by 2040
                </div>
              )}
              {s.total_savings_inr > 0 && (
                <div className="text-xs text-blue-700">
                  {formatINR(s.total_savings_inr)} saved
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Timeline panels */}
        {data.scenarios.map((s) => (
          <div
            key={s.scenario_id}
            id={`panel-${s.scenario_id}`}
            role="tabpanel"
            aria-labelledby={`tab-${s.scenario_id}`}
            hidden={activeScenario !== s.scenario_id}
          >
            <Timeline scenario={s} isActive={activeScenario === s.scenario_id} />
          </div>
        ))}
      </section>

      {/* Reset button */}
      <div className="text-center pt-4">
        <button
          onClick={onReset}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl
            hover:border-gray-400 hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
            transition-colors font-medium"
          aria-label="Start over and enter a new profile"
        >
          ← Start Over
        </button>
      </div>
    </div>
  )
})

FutureComparison.displayName = 'FutureComparison'
