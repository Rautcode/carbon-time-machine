/**
 * Application-wide constants derived from scientific sources.
 * Centralised here to avoid magic numbers scattered across components.
 */

/** Paris Agreement 1.5°C per-capita annual budget (tons CO₂e/year) — IPCC SR1.5 */
export const PARIS_LIMIT_TONS = 2.0

/** CO₂ absorbed by one mature tree per year in kg — USDA Forest Service */
export const TREE_SEQUESTRATION_KG = 21

/** Carbon footprint severity thresholds in tons CO₂e/year */
export const EMISSION_THRESHOLDS = {
  low: 1.5,
  moderate: 3,
  high: 5,
} as const

/** Scenario IDs used across the application */
export const SCENARIO_IDS = {
  bau: 'bau',
  small: 'small',
  committed: 'committed',
} as const

/** Projection years shown in the timeline */
export const PROJECTION_YEARS = [2030, 2035, 2040] as const

/** Maximum gauge scale for the CO₂ gauge (tons/year) */
export const GAUGE_MAX_TONS = 10
