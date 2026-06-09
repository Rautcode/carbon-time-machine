import { memo, useEffect, useState } from 'react'
import { fetchClimate } from '../../api/extras'
import type { ClimateContext } from '../../types'

export const ClimateWidget = memo(() => {
  const [data, setData] = useState<ClimateContext | null>(null)

  useEffect(() => {
    fetchClimate()
      .then(setData)
      .catch((err) => { console.warn('[ClimateWidget] fetch failed:', err) })
  }, [])

  if (!data) return null

  return (
    <div
      className="flex items-center gap-3 ml-auto text-xs text-gray-500"
      aria-label="Live climate context"
      title={`Data from Open-Meteo · ${data.location}`}
    >
      <span className="hidden sm:flex items-center gap-1">
        <span aria-hidden="true">🌡️</span>
        <span>{data.current_temp_c}°C</span>
        <span className="text-gray-300">·</span>
        <span className="text-orange-500 font-medium">{data.global_anomaly_c > 0 ? '+' : ''}{data.global_anomaly_c}°C</span>
        <span className="text-gray-400">above pre-industrial</span>
      </span>
      <span className="flex items-center gap-1">
        <span aria-hidden="true">🌫️</span>
        <span className="font-medium text-gray-600">{data.co2_ppm} ppm CO₂</span>
      </span>
    </div>
  )
})

ClimateWidget.displayName = 'ClimateWidget'
