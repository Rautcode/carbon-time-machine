import { memo, useState, useEffect, useRef } from 'react'
import type { FutureScenario } from '../../types'
import { formatINR } from '../../utils/formatters'

interface Props {
  /** The Committed scenario — used for savings calculations */
  committedScenario: FutureScenario
}

/** Population presets for the impact multiplier */
const PRESETS = [
  { label: '1,000',   value: 1_000,     emoji: '🏘️', place: 'a neighbourhood' },
  { label: '10,000',  value: 10_000,    emoji: '🏙️', place: 'a township'      },
  { label: '1 Lakh',  value: 100_000,   emoji: '🌆', place: 'a city ward'     },
  { label: '10 Lakh', value: 1_000_000, emoji: '🌇', place: 'a major city'    },
] as const

/** One mature tree sequesters ~21 kg CO₂/year (USDA Forest Service) */
const TREE_KG = 21
/** Average Indian car emits ~1,800 kg CO₂/year */
const CAR_KG_PER_YEAR = 1_800
/** Horizon year shown in the headline */
const HORIZON_YEAR = 2040
/** Number of projection years (2025 → 2040) */
const HORIZON_YEARS = 15

/**
 * Animated count-up hook — counts from 0 to `target` over ~1.2 s.
 * Uses an `isCancelled` flag to prevent setState calls after unmount
 * or after the effect re-runs, avoiding the stale-closure trap.
 */
function useCountUp(target: number, active: boolean): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!active) {
      setValue(0)
      return
    }

    let isCancelled = false
    const startTime = performance.now()
    const duration = 1200

    const tick = (now: number) => {
      if (isCancelled) return
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      isCancelled = true
      cancelAnimationFrame(frameRef.current)
    }
  }, [target, active])

  return value
}

/** Format large numbers with Indian locale (K / L / Cr) */
function fmtBig(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000)    return `${(n / 100_000).toFixed(1)} L`
  if (n >= 1_000)      return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('en-IN')
}

/** Single animated stat card */
const StatCard = memo(function StatCard({
  icon, value, unit, label, color, active,
}: {
  icon: string
  value: number
  unit: string
  label: string
  color: string
  active: boolean
}) {
  const displayed = useCountUp(value, active)
  return (
    <div className={`flex flex-col items-center text-center p-5 rounded-2xl border ${color} bg-white/80`}>
      <span className="text-3xl mb-2" aria-hidden="true">{icon}</span>
      <span className="text-2xl font-extrabold text-gray-900 tabular-nums">
        {fmtBig(displayed)}
      </span>
      <span className="text-xs text-gray-500 font-medium mt-0.5">{unit}</span>
      <span className="text-xs text-gray-400 mt-1 leading-snug">{label}</span>
    </div>
  )
})

/**
 * CommunityImpact — shows the collective effect of a neighbourhood/city
 * adopting the user's Committed scenario lifestyle.
 * Purely deterministic math — no API call needed.
 */
export const CommunityImpact = memo(({ committedScenario }: Props) => {
  const [preset, setPreset] = useState<typeof PRESETS[number]>(PRESETS[1])
  // Incrementing key forces StatCard remount → restarts count-up reliably
  const [animKey, setAnimKey] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Trigger animation when section scrolls into view
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handlePreset = (p: typeof PRESETS[number]) => {
    setPreset(p)
    setAnimKey((k) => k + 1) // force count-up restart
  }

  const n = preset.value
  const savingsTonsPerPerson = committedScenario.total_savings_tons
  const savingsInrPerPerson  = committedScenario.total_savings_inr

  const totalTonsSaved    = Math.round(savingsTonsPerPerson * n)
  const totalTreesPlanted = Math.round((totalTonsSaved * 1_000) / TREE_KG)
  const carsRemoved       = Math.round((totalTonsSaved * 1_000) / CAR_KG_PER_YEAR)
  const moneySaved        = Math.round(savingsInrPerPerson * n)

  const active = visible

  return (
    <div ref={ref} className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-md p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl" aria-hidden="true">🌏</span>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Community Impact</h3>
          <p className="text-sm text-gray-500">What if your city followed your Committed plan?</p>
        </div>
      </div>

      {/* Preset selector */}
      <div className="flex flex-wrap gap-2 mb-6 mt-4" role="group" aria-label="Select community size">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p)}
            aria-pressed={preset.value === p.value}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all
              focus:outline-none focus:ring-2 focus:ring-green-400
              ${preset.value === p.value
                ? 'bg-green-600 text-white border-green-600 shadow-md scale-105'
                : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
              }`}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      {/* Impact headline */}
      <p className="text-center text-sm text-gray-600 mb-5 font-medium">
        If <span className="font-bold text-green-700">{preset.label} people</span> in{' '}
        <span className="text-gray-800">{preset.place}</span>{' '}
        switched to your Committed lifestyle by {HORIZON_YEAR}:
      </p>

      {/* Stat cards — key forces remount + fresh count-up on preset change */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard key={`tons-${animKey}`}
          icon="🌫️" value={totalTonsSaved} unit="tons CO₂ saved"
          label={`over ${HORIZON_YEARS} years`} color="border-orange-200"
          active={active}
        />
        <StatCard key={`trees-${animKey}`}
          icon="🌲" value={totalTreesPlanted} unit="trees planted"
          label="equivalent offset" color="border-green-200"
          active={active}
        />
        <StatCard key={`cars-${animKey}`}
          icon="🚗" value={carsRemoved} unit="cars off the road"
          label="for a full year" color="border-blue-200"
          active={active}
        />
        <StatCard key={`money-${animKey}`}
          icon="💰" value={moneySaved} unit="₹ total saved"
          label="in fuel + electricity" color="border-purple-200"
          active={active}
        />
      </div>

      {/* Money formatted in INR */}
      <div className="text-center text-xs text-gray-400 mb-4">
        Community money saved:{' '}
        <span className="font-semibold text-gray-600">{formatINR(moneySaved)}</span>
      </div>

      {/* Inspire nudge */}
      <div className="text-center bg-green-700/10 border border-green-200 rounded-xl p-3">
        <p className="text-xs text-green-800 font-medium">
          🌱 Your individual choice multiplies into city-scale change.
          Share your Committed plan and inspire others.
        </p>
      </div>
    </div>
  )
})

CommunityImpact.displayName = 'CommunityImpact'
