/** Format a number as Indian Rupees (₹1,23,456) */
export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format a number with commas (1,23,456) */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}

/** Format tons with 1 decimal place */
export function formatTons(tons: number): string {
  return `${tons.toFixed(1)} t CO₂`
}

/** Return a color class based on emissions relative to baseline */
export function emissionColor(tons: number): string {
  if (tons <= 1.5) return 'text-green-600'
  if (tons <= 3) return 'text-yellow-600'
  if (tons <= 5) return 'text-orange-500'
  return 'text-red-600'
}

/** Return a Tailwind background class for scenario card */
export function scenarioGradient(id: string): string {
  switch (id) {
    case 'bau': return 'from-red-50 to-orange-50 border-red-200'
    case 'small': return 'from-yellow-50 to-amber-50 border-amber-200'
    case 'committed': return 'from-green-50 to-emerald-50 border-green-200'
    default: return 'from-gray-50 to-gray-100 border-gray-200'
  }
}

/** Percentage of total for a breakdown value */
export function breakdownPercent(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}
