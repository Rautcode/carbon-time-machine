import { memo, useState, useCallback } from 'react'
import type { ScenarioResponse } from '../../types'
import { generateShareCard } from '../../utils/shareCard'

interface Props {
  data: ScenarioResponse
}

type Status = 'idle' | 'generating' | 'done' | 'error'

/**
 * "Share My Impact" button — generates a 1080×1080 PNG carbon identity card
 * and triggers a browser download. No external dependencies.
 */
export const ShareCardButton = memo(({ data }: Props) => {
  const [status, setStatus] = useState<Status>('idle')

  const handleGenerate = useCallback(async () => {
    if (status === 'generating') return
    setStatus('generating')

    let objectUrl: string | null = null
    try {
      const committed = data.scenarios.find(s => s.scenario_id === 'committed')
      const savingsTons = committed?.total_savings_tons ?? 0

      objectUrl = await generateShareCard(
        data.current_annual_tons,
        data.breakdown,
        savingsTons,
      )

      // Trigger download
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = 'my-carbon-footprint.png'
      a.click()

      setStatus('done')
      // Reset after 3 s so the button can be used again
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      console.error('Share card generation failed:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      // Revoke object URL after a short delay so the download has time to start
      if (objectUrl !== null) {
        const url = objectUrl
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }
    }
  }, [data, status])

  const label: Record<Status, string> = {
    idle:       '📸  Share My Impact',
    generating: '⏳  Generating card…',
    done:       '✅  Card downloaded!',
    error:      '❌  Try again',
  }

  const colorClass: Record<Status, string> = {
    idle:       'bg-white border-gray-300 text-gray-700 hover:border-green-400 hover:text-green-700 hover:bg-green-50',
    generating: 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed',
    done:       'bg-green-50 border-green-400 text-green-700',
    error:      'bg-red-50 border-red-300 text-red-600',
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={status === 'generating'}
      aria-label="Download a shareable carbon identity card as PNG"
      className={`
        inline-flex items-center gap-2 px-5 py-2.5
        rounded-full border-2 text-sm font-semibold
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
        ${colorClass[status]}
      `}
    >
      {label[status]}
    </button>
  )
})

ShareCardButton.displayName = 'ShareCardButton'
