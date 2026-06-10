import { memo, useState } from 'react'
import type { ScenarioResponse } from '../../types'
import { Timeline } from '../Timeline'
import { TipsPanel } from '../TipsPanel'
import { CommunityImpact } from '../CommunityImpact'
import { ShareCardButton } from '../ShareCard'
import { LetterModal } from '../LetterModal'
import { formatINR, formatTons, breakdownPercent, scenarioGradient } from '../../utils/formatters'
import { PARIS_LIMIT_TONS, GAUGE_MAX_TONS } from '../../constants'

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
  food:      'bg-orange-500',
  energy:    'bg-yellow-500',
  shopping:  'bg-purple-500',
  digital:   'bg-teal-500',
}

const BAR_LABELS: Record<string, string> = {
  transport: '🚗 Transport',
  food:      '🍽 Food',
  energy:    '⚡ Energy',
  shopping:  '🛍 Shopping',
  digital:   '📱 Digital',
}

/* ── Animated circular CO₂ gauge ───────────────────────────────────────── */
function CarbonGauge({ tons }: { tons: number }) {
  const R = 50
  const circ = 2 * Math.PI * R
  const pct = Math.min(1, tons / GAUGE_MAX_TONS)
  const offset = circ * (1 - pct)
  const color  = tons <= 2 ? '#16a34a' : tons <= 4 ? '#ca8a04' : tons <= 6 ? '#ea580c' : '#dc2626'
  const bgRing = tons <= 2 ? '#bbf7d0' : tons <= 4 ? '#fef08a' : tons <= 6 ? '#fed7aa' : '#fecaca'
  const label  = tons <= 2 ? 'Low 🌿' : tons <= 4 ? 'Moderate ⚠️' : tons <= 6 ? 'High 🔥' : 'Critical 🚨'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="144" height="144"
        viewBox="0 0 120 120"
        role="img"
        aria-label={`Current carbon footprint: ${tons.toFixed(1)} tons CO₂ per year`}
      >
        <title>Carbon footprint gauge</title>
        <circle cx="60" cy="60" r={R} fill="none" stroke={bgRing} strokeWidth="13" />
        <circle
          cx="60" cy="60" r={R}
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="gauge-arc"
        />
        <text x="60" y="52" textAnchor="middle" fontSize="22" fontWeight="800" fill={color} fontFamily="system-ui">
          {tons.toFixed(1)}
        </text>
        <text x="60" y="66" textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="system-ui">t CO₂ / year</text>
        <text x="60" y="80" textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="system-ui">per person</text>
      </svg>
      <span className="text-xs font-bold px-3 py-1 rounded-full animate-count-in" style={{ color, background: bgRing }}>
        {label}
      </span>
    </div>
  )
}

/* ── Paris 1.5°C alignment badge ────────────────────────────────────────── */
function ParisBadge({ committedTons2030 }: { committedTons2030: number }) {
  const aligned = committedTons2030 <= PARIS_LIMIT_TONS
  return (
    <div
      role="status"
      aria-label={aligned ? 'Paris 1.5°C aligned' : 'Above Paris 1.5°C target'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
        aligned
          ? 'bg-green-50 text-green-800 border-green-300'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      {aligned
        ? '✓ Paris 1.5°C Aligned'
        : `⚠ ${committedTons2030.toFixed(1)}t — Above 1.5°C Target`}
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */
export const FutureComparison = memo(({ data, onReset }: Props) => {
  const [activeScenario, setActiveScenario] = useState(
    () => data.scenarios[0]?.scenario_id ?? 'bau'
  )
  const [letterOpen, setLetterOpen] = useState(false)
  const total = data.current_annual_tons

  const committed = data.scenarios.find((s) => s.scenario_id === 'committed')
  const paris2030 =
    committed?.timeline.find((t) => t.year === 2030)?.annual_emissions_tons ?? Infinity

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Top row: gauge + breakdown (full width) ── */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <CarbonGauge tons={total} />
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h2 className="text-2xl font-bold text-gray-900">Your Environmental Future</h2>
              {Number.isFinite(paris2030) && <ParisBadge committedTons2030={paris2030} />}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
              {(Object.entries(data.breakdown) as [keyof typeof data.breakdown, number][]).map(([key, val]) => {
                const pct = total > 0 ? Math.max(0, breakdownPercent(val, total)) : 0
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <dt className="text-gray-600 font-medium">{BAR_LABELS[key] ?? key}</dt>
                      <dd className="text-gray-600">{formatTons(val)} ({pct}%)</dd>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="presentation">
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
          </div>
        </div>
      </div>

      {/* ── Main desktop layout: sidebar + timeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT sidebar: scenario selector ── */}
        <aside className="lg:col-span-1 space-y-4">
          <h3 className="text-base font-semibold text-gray-800">Choose a Future Path</h3>
          <div role="tablist" aria-label="Select future scenario" className="flex flex-col gap-3">
            {data.scenarios.map((s) => (
              <button
                key={s.scenario_id}
                role="tab"
                aria-selected={activeScenario === s.scenario_id}
                aria-controls={`panel-${s.scenario_id}`}
                id={`tab-${s.scenario_id}`}
                onClick={() => setActiveScenario(s.scenario_id)}
                className={`rounded-2xl border-2 p-4 text-left transition-all w-full
                  focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1
                  ${activeScenario === s.scenario_id
                    ? 'border-green-500 shadow-lg bg-green-50 animate-glow-green'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white/80'
                  } bg-gradient-to-br ${scenarioGradient(s.scenario_id)}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">{SCENARIO_ICONS[s.scenario_id] ?? '🌍'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 leading-tight">{s.label}</div>
                    {s.total_savings_tons > 0 && (
                      <div className="text-xs text-green-700 mt-0.5 font-semibold">
                        Save {s.total_savings_tons.toFixed(1)}t by 2040
                      </div>
                    )}
                    {s.total_savings_inr > 0 && (
                      <div className="text-xs text-blue-600">{formatINR(s.total_savings_inr)} saved</div>
                    )}
                  </div>
                  {activeScenario === s.scenario_id && (
                    <span className="text-green-500 text-lg" aria-hidden="true">›</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Reset button in sidebar on desktop */}
          <button
            onClick={onReset}
            className="w-full px-4 py-2.5 border-2 border-gray-300 text-gray-600 rounded-2xl
              hover:border-gray-400 hover:bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
              transition-all font-medium text-sm mt-2"
            aria-label="Start over and enter a new profile"
          >
            ← Start Over
          </button>
        </aside>

        {/* ── RIGHT: timeline panels ── */}
        <section className="lg:col-span-2" aria-label="Future scenarios">
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

      </div>{/* end sidebar + timeline grid */}

      {/* ── AI Tips (full width) ── */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm p-6">
        <TipsPanel
          currentAnnualTons={data.current_annual_tons}
          breakdown={data.breakdown}
        />
      </div>

      {/* ── Community Impact (full width, only when committed scenario exists) ── */}
      {committed && (
        <CommunityImpact committedScenario={committed} />
      )}

      {/* ── Share + Letter CTAs ── */}
      <div className="flex flex-wrap items-center justify-center gap-3 py-2">
        <ShareCardButton data={data} />
        <button
          onClick={() => setLetterOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5
            rounded-full border-2 border-amber-300 text-amber-800 bg-amber-50
            hover:border-amber-500 hover:bg-amber-100
            text-sm font-semibold transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          aria-label="Read a letter written by your 2050 self"
        >
          ✉️  Letter from Your 2050 Self
        </button>
      </div>

      {/* ── Letter modal (portal-style, rendered in-tree) ── */}
      {letterOpen && (
        <LetterModal data={data} onClose={() => setLetterOpen(false)} />
      )}

    </div>
  )
})

FutureComparison.displayName = 'FutureComparison'
