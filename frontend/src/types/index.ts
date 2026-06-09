export type DietType = 'meat_heavy' | 'meat_moderate' | 'vegetarian' | 'vegan'

export interface UserProfile {
  car_km_per_week: number
  domestic_flights_per_year: number
  international_flights_per_year: number
  public_transport_km_per_week: number
  diet_type: DietType
  local_food_percent: number
  monthly_electricity_kwh: number
  renewable_energy_percent: number
  home_size_sqft: number
  new_clothing_items_per_year: number
  new_electronics_per_year: number
}

export interface TimelinePoint {
  year: number
  annual_emissions_tons: number
  cumulative_emissions_tons: number
  equivalent_trees: number
  financial_cost_inr: number
  narrative: string
}

export interface FutureScenario {
  scenario_id: string
  label: string
  changes: string[]
  timeline: TimelinePoint[]
  total_savings_tons: number
  total_savings_inr: number
  summary: string
}

export interface ScenarioResponse {
  current_annual_tons: number
  breakdown: {
    transport: number
    food: number
    energy: number
    shopping: number
  }
  scenarios: FutureScenario[]
  generated_at: string
}

export type AppStep = 'input' | 'loading' | 'results'
