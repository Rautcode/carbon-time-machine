import React, { memo, useCallback, useState } from 'react'
import type { UserProfile, DietType } from '../../types'

interface Props {
  onSubmit: (profile: UserProfile) => void
  loading: boolean
}

const PERSONA_PRESETS: { label: string; emoji: string; description: string; profile: UserProfile }[] = [
  {
    label: 'Student',
    emoji: '🎓',
    description: 'Low car use, veg diet',
    profile: {
      car_km_per_week: 20, domestic_flights_per_year: 0, international_flights_per_year: 0,
      public_transport_km_per_week: 60, diet_type: 'vegetarian', local_food_percent: 30,
      monthly_electricity_kwh: 60, renewable_energy_percent: 5, home_size_sqft: 200,
      new_clothing_items_per_year: 8, new_electronics_per_year: 1,
      streaming_hours_per_week: 20, online_orders_per_month: 3,
    },
  },
  {
    label: 'Urban Pro',
    emoji: '🏙️',
    description: 'Car + flights, mixed diet',
    profile: {
      car_km_per_week: 150, domestic_flights_per_year: 6, international_flights_per_year: 1,
      public_transport_km_per_week: 30, diet_type: 'meat_moderate', local_food_percent: 20,
      monthly_electricity_kwh: 300, renewable_energy_percent: 5, home_size_sqft: 900,
      new_clothing_items_per_year: 20, new_electronics_per_year: 2,
      streaming_hours_per_week: 15, online_orders_per_month: 8,
    },
  },
  {
    label: 'Family',
    emoji: '👨‍👩‍👧',
    description: 'Large home, high consumption',
    profile: {
      car_km_per_week: 250, domestic_flights_per_year: 4, international_flights_per_year: 0,
      public_transport_km_per_week: 20, diet_type: 'meat_moderate', local_food_percent: 35,
      monthly_electricity_kwh: 500, renewable_energy_percent: 10, home_size_sqft: 1500,
      new_clothing_items_per_year: 40, new_electronics_per_year: 3,
      streaming_hours_per_week: 25, online_orders_per_month: 12,
    },
  },
  {
    label: 'Minimalist',
    emoji: '🌿',
    description: 'Zero car, vegan, solar',
    profile: {
      car_km_per_week: 0, domestic_flights_per_year: 0, international_flights_per_year: 0,
      public_transport_km_per_week: 80, diet_type: 'vegan', local_food_percent: 70,
      monthly_electricity_kwh: 80, renewable_energy_percent: 60, home_size_sqft: 400,
      new_clothing_items_per_year: 3, new_electronics_per_year: 0,
      streaming_hours_per_week: 5, online_orders_per_month: 1,
    },
  },
]

const DEFAULT_PROFILE: UserProfile = {
  car_km_per_week: 100,
  domestic_flights_per_year: 2,
  international_flights_per_year: 0,
  public_transport_km_per_week: 20,
  diet_type: 'meat_moderate',
  local_food_percent: 20,
  monthly_electricity_kwh: 300,
  renewable_energy_percent: 5,
  home_size_sqft: 1000,
  new_clothing_items_per_year: 15,
  new_electronics_per_year: 2,
  streaming_hours_per_week: 10,
  online_orders_per_month: 4,
}

const DIET_OPTIONS: { value: DietType; label: string; emoji: string; sub: string }[] = [
  { value: 'meat_heavy', label: 'Meat daily',          emoji: '🥩', sub: '7.19 kg CO₂/day' },
  { value: 'meat_moderate', label: 'Meat few times/wk', emoji: '🍗', sub: '5.63 kg CO₂/day' },
  { value: 'vegetarian', label: 'Vegetarian',          emoji: '🥗', sub: '3.81 kg CO₂/day' },
  { value: 'vegan',      label: 'Vegan',               emoji: '🌱', sub: '2.89 kg CO₂/day' },
]

/* ── Slider + number combo ──────────────────────────────────────────────── */
interface SliderProps {
  id: string
  label: string
  unit?: string
  min?: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
  hint?: string
  required?: boolean
}

const SliderField = memo(({
  id, label, unit, min = 0, max, step = 1, value, onChange, hint, required = true,
}: SliderProps) => {
  const range = max - min
  const pct = range > 0 ? Math.min(100, Math.max(0, Math.round(((value - min) / range) * 100))) : 0
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-sm font-bold text-green-700 tabular-nums">
          {value}
          {unit && <span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        required={required}
        aria-required={required}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}${unit ? ' ' + unit : ''}`}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          background: `linear-gradient(to right, #16a34a ${pct}%, #d1fae5 ${pct}%)`,
        }}
        className="w-full h-2 rounded-full cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
})
SliderField.displayName = 'SliderField'

/* ── Number-only field (for integers that don't suit sliders) ───────────── */
interface NumberProps {
  id: string
  label: string
  unit?: string
  min?: number
  max?: number
  step?: number
  value: number
  onChange: (v: number) => void
  hint?: string
}

const NumberField = memo(({ id, label, unit, min = 0, max, step = 1, value, onChange, hint }: NumberProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {unit && <span className="text-gray-500 font-normal ml-1 text-xs">({unit})</span>}
    </label>
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      required
      autoComplete="off"
      aria-required="true"
      onChange={(e) => onChange(Math.min(max ?? Infinity, Math.max(min, parseFloat(e.target.value) || 0)))}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
        focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300
        transition-colors bg-white"
      aria-describedby={hint ? `${id}-hint` : undefined}
    />
    {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
))
NumberField.displayName = 'NumberField'

/* ── Fieldset section card ──────────────────────────────────────────────── */
interface SectionProps {
  title: string
  emoji: string
  color?: string
  children: React.ReactNode
}

const Section = memo(({ title, emoji, color = 'border-green-200', children }: SectionProps) => (
  <fieldset className={`border-2 ${color} rounded-2xl p-5 bg-white/80 backdrop-blur-sm shadow-sm section-card`}>
    <legend className="px-2 text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
      <span aria-hidden="true" className="text-lg">{emoji}</span> {title}
    </legend>
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>
  </fieldset>
))
Section.displayName = 'Section'

/* ── Main form ──────────────────────────────────────────────────────────── */
export const InputForm = memo(({ onSubmit, loading }: Props) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)

  const set = useCallback(<K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(profile)
    },
    [profile, onSubmit],
  )

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Carbon footprint profile form">
      <div className="space-y-5">

        {/* ── Persona presets ── */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Quick start — pick a persona
          </p>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Persona presets">
            {PERSONA_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setProfile(p.profile)}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl border-2 border-gray-200
                  bg-white hover:border-green-400 hover:bg-green-50 hover:shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1
                  transition-all text-center"
                aria-label={`Load ${p.label} persona: ${p.description}`}
              >
                <span className="text-2xl" aria-hidden="true">{p.emoji}</span>
                <span className="text-xs font-semibold text-gray-700 leading-tight">{p.label}</span>
                <span className="text-xs text-gray-400 leading-tight hidden sm:block">{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* ── Transport ── */}
        <Section title="Transport" emoji="🚗" color="border-blue-200">
          <SliderField
            id="car_km"
            label="Car distance"
            unit="km/week"
            max={500}
            step={10}
            value={profile.car_km_per_week}
            onChange={(v) => set('car_km_per_week', v)}
            hint="Typical Indian urban commute: 80–150 km/week"
          />
          <SliderField
            id="public_transport"
            label="Public transport"
            unit="km/week"
            max={200}
            step={5}
            value={profile.public_transport_km_per_week}
            onChange={(v) => set('public_transport_km_per_week', v)}
            hint="Metro, bus, auto-rickshaw"
          />
          <NumberField
            id="domestic_flights"
            label="Domestic flights"
            unit="per year"
            max={100}
            value={profile.domestic_flights_per_year}
            onChange={(v) => set('domestic_flights_per_year', Math.round(v))}
          />
          <NumberField
            id="intl_flights"
            label="International flights"
            unit="per year"
            max={50}
            value={profile.international_flights_per_year}
            onChange={(v) => set('international_flights_per_year', Math.round(v))}
          />
        </Section>

        {/* ── Food ── */}
        <Section title="Food & Diet" emoji="🍽️" color="border-orange-200">
          <div className="sm:col-span-2">
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-3">Diet type</legend>
              <div
                role="radiogroup"
                aria-label="Select your diet type"
                className="grid grid-cols-2 gap-2"
              >
                {DIET_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      profile.diet_type === opt.value
                        ? 'border-green-500 bg-green-50 text-green-800 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="diet_type"
                      value={opt.value}
                      checked={profile.diet_type === opt.value}
                      onChange={() => set('diet_type', opt.value)}
                      className="sr-only"
                    />
                    <span aria-hidden="true" className="text-xl">{opt.emoji}</span>
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-xs text-gray-400">{opt.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <SliderField
            id="local_food"
            label="Locally sourced food"
            unit="%"
            max={100}
            step={5}
            value={profile.local_food_percent}
            onChange={(v) => set('local_food_percent', v)}
            hint="Reduces food transport emissions by up to 10%"
          />
        </Section>

        {/* ── Energy ── */}
        <Section title="Home Energy" emoji="⚡" color="border-yellow-200">
          <SliderField
            id="electricity"
            label="Electricity"
            unit="kWh/month"
            max={1000}
            step={10}
            value={profile.monthly_electricity_kwh}
            onChange={(v) => set('monthly_electricity_kwh', v)}
            hint="Average Indian household: 150–400 kWh/month"
          />
          <SliderField
            id="renewable"
            label="Renewable share"
            unit="%"
            max={100}
            step={5}
            value={profile.renewable_energy_percent}
            onChange={(v) => set('renewable_energy_percent', v)}
            hint="Solar panels, green tariff, etc."
          />
          <NumberField
            id="home_size"
            label="Home size"
            unit="sq ft"
            max={20000}
            step={100}
            value={profile.home_size_sqft}
            onChange={(v) => set('home_size_sqft', v)}
          />
        </Section>

        {/* ── Shopping ── */}
        <Section title="Shopping" emoji="🛍️" color="border-purple-200">
          <NumberField
            id="clothing"
            label="New clothing items"
            unit="per year"
            max={500}
            value={profile.new_clothing_items_per_year}
            onChange={(v) => set('new_clothing_items_per_year', Math.round(v))}
            hint="Average: 20–30 items/year"
          />
          <NumberField
            id="electronics"
            label="New electronics"
            unit="per year"
            max={100}
            value={profile.new_electronics_per_year}
            onChange={(v) => set('new_electronics_per_year', Math.round(v))}
            hint="Phone, laptop, TV, etc."
          />
        </Section>

        {/* ── Digital / Shadow Carbon ── */}
        <Section title="Digital Life" emoji="📱" color="border-teal-200">
          <SliderField
            id="streaming"
            label="Video streaming"
            unit="hrs/week"
            max={40}
            step={1}
            value={profile.streaming_hours_per_week}
            onChange={(v) => set('streaming_hours_per_week', v)}
            hint="HD streaming ≈ 36 g CO₂/hr (IEA 2023)"
          />
          <SliderField
            id="online_orders"
            label="Online deliveries"
            unit="orders/month"
            max={30}
            step={1}
            value={profile.online_orders_per_month}
            onChange={(v) => set('online_orders_per_month', Math.round(v))}
            hint="Standard delivery ≈ 300 g CO₂/package"
          />
        </Section>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600
            hover:from-green-700 hover:to-emerald-700
            disabled:from-green-400 disabled:to-green-400
            text-white text-lg font-semibold rounded-2xl transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0
            animate-glow-green"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span
                className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"
                aria-hidden="true"
              />
              Generating your future…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span aria-hidden="true">🌍</span>
              See My Environmental Future
            </span>
          )}
        </button>
      </div>
    </form>
  )
})

InputForm.displayName = 'InputForm'
