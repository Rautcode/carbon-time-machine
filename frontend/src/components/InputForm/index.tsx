import React, { memo, useCallback, useState } from 'react'
import type { UserProfile, DietType } from '../../types'

interface Props {
  onSubmit: (profile: UserProfile) => void
  loading: boolean
}

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
}

const DIET_OPTIONS: { value: DietType; label: string; emoji: string }[] = [
  { value: 'meat_heavy', label: 'Meat every day', emoji: '🥩' },
  { value: 'meat_moderate', label: 'Meat a few times/week', emoji: '🍗' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
]

interface FieldProps {
  id: string
  label: string
  unit?: string
  min?: number
  max?: number
  step?: number
  value: number
  onChange: (v: number) => void
  hint?: string
  required?: boolean
}

const NumberField = memo(
  ({ id, label, unit, min = 0, max, step = 1, value, onChange, hint, required = true }: FieldProps) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {unit && <span className="text-gray-600 font-normal ml-1">({unit})</span>}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        required={required}
        autoComplete="off"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
          focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300
          transition-colors"
        aria-describedby={hint ? `${id}-hint` : undefined}
        aria-required={required}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-gray-600">
          {hint}
        </p>
      )}
    </div>
  ),
)

interface SectionProps {
  title: string
  emoji: string
  children: React.ReactNode
}

const Section = memo(({ title, emoji, children }: SectionProps) => (
  <fieldset className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
    <legend className="px-2 text-base font-semibold text-gray-800 flex items-center gap-2">
      <span aria-hidden="true">{emoji}</span> {title}
    </legend>
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </fieldset>
))

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
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Carbon footprint profile form"
    >
      <div className="space-y-6">
        {/* Transport */}
        <Section title="Transport" emoji="🚗">
          <NumberField
            id="car_km"
            label="Car distance"
            unit="km/week"
            max={5000}
            value={profile.car_km_per_week}
            onChange={(v) => set('car_km_per_week', v)}
            hint="Typical Indian urban commute: 80–150 km/week"
          />
          <NumberField
            id="public_transport"
            label="Public transport"
            unit="km/week"
            max={2000}
            value={profile.public_transport_km_per_week}
            onChange={(v) => set('public_transport_km_per_week', v)}
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

        {/* Food */}
        <Section title="Food" emoji="🍽️">
          <div className="sm:col-span-2">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Diet type
              </legend>
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Select your diet type"
              >
                {DIET_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      profile.diet_type === opt.value
                        ? 'border-green-500 bg-green-50 text-green-800'
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
                    <span aria-hidden="true">{opt.emoji}</span>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <NumberField
            id="local_food"
            label="Locally sourced food"
            unit="%"
            max={100}
            step={5}
            value={profile.local_food_percent}
            onChange={(v) => set('local_food_percent', Math.min(100, Math.max(0, v)))}
            hint="Reduces food transport emissions"
          />
        </Section>

        {/* Energy */}
        <Section title="Home Energy" emoji="⚡">
          <NumberField
            id="electricity"
            label="Electricity consumption"
            unit="kWh/month"
            max={10000}
            step={10}
            value={profile.monthly_electricity_kwh}
            onChange={(v) => set('monthly_electricity_kwh', v)}
            hint="Average Indian household: 150–400 kWh/month"
          />
          <NumberField
            id="renewable"
            label="Renewable energy share"
            unit="%"
            max={100}
            step={5}
            value={profile.renewable_energy_percent}
            onChange={(v) => set('renewable_energy_percent', Math.min(100, Math.max(0, v)))}
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

        {/* Shopping */}
        <Section title="Shopping" emoji="🛍️">
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

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-green-400
            text-white text-lg font-semibold rounded-xl transition-colors
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md"
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
            '🌍 See My Environmental Future'
          )}
        </button>
      </div>
    </form>
  )
})

InputForm.displayName = 'InputForm'
