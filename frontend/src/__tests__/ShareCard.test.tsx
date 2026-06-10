/**
 * Unit tests for the ShareCardButton component.
 *
 * generateShareCard is mocked so no real Canvas drawing occurs.
 * The tests focus on state machine transitions: idle → generating → done/error.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ShareCardButton } from '../components/ShareCard'
import type { ScenarioResponse } from '../types'

// ── Module mock ────────────────────────────────────────────────────────────────

vi.mock('../utils/shareCard', () => ({
  generateShareCard: vi.fn(),
}))

import { generateShareCard } from '../utils/shareCard'
const mockGenerate = vi.mocked(generateShareCard)

// ── Test fixture ───────────────────────────────────────────────────────────────

const makeTimeline = () => [
  {
    year: 2030,
    annual_emissions_tons: 3.5,
    cumulative_emissions_tons: 17.5,
    equivalent_trees: 167,
    financial_cost_inr: 70000,
    narrative: 'Test 2030.',
  },
  {
    year: 2040,
    annual_emissions_tons: 3.0,
    cumulative_emissions_tons: 52.5,
    equivalent_trees: 143,
    financial_cost_inr: 85000,
    narrative: 'Test 2040.',
  },
]

const MOCK_DATA: ScenarioResponse = {
  current_annual_tons: 4.0,
  breakdown: { transport: 2.0, food: 1.0, energy: 0.7, shopping: 0.3, digital: 0 },
  scenarios: [
    {
      scenario_id: 'bau',
      label: 'Current Path',
      changes: [],
      timeline: makeTimeline(),
      total_savings_tons: 0,
      total_savings_inr: 0,
      summary: 'BAU summary.',
    },
    {
      scenario_id: 'committed',
      label: 'Committed Future',
      changes: ['Public transport', 'Vegetarian'],
      timeline: makeTimeline(),
      total_savings_tons: 18.5,
      total_savings_inr: 120000,
      summary: 'Committed summary.',
    },
  ],
  generated_at: '2025-01-01T00:00:00Z',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Mock URL.createObjectURL / revokeObjectURL so jsdom doesn't throw */
function patchURLMethods() {
  URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
  URL.revokeObjectURL = vi.fn()
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ShareCardButton', () => {
  beforeEach(() => {
    // shouldAdvanceTime keeps waitFor's internal polling alive while still
    // allowing manual fast-forward with vi.advanceTimersByTime().
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    patchURLMethods()  // must run AFTER clearAllMocks so the vi.fn() stubs survive
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ── Idle state ───────────────────────────────────────────────────────────────

  it('renders "Share My Impact" label in idle state', () => {
    render(<ShareCardButton data={MOCK_DATA} />)
    expect(screen.getByRole('button', { name: /download a shareable carbon identity card/i })).toBeInTheDocument()
    expect(screen.getByText(/share my impact/i)).toBeInTheDocument()
  })

  it('is not disabled in idle state', () => {
    render(<ShareCardButton data={MOCK_DATA} />)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  // ── Generating state ─────────────────────────────────────────────────────────

  it('disables the button while generating', async () => {
    // Never resolves — keeps the component stuck in "generating"
    mockGenerate.mockReturnValue(new Promise(() => {}))

    render(<ShareCardButton data={MOCK_DATA} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() =>
      expect(screen.getByRole('button')).toBeDisabled()
    )
    expect(screen.getByText(/generating card/i)).toBeInTheDocument()
  })

  it('does not call generateShareCard twice if clicked while generating', async () => {
    mockGenerate.mockReturnValue(new Promise(() => {}))

    render(<ShareCardButton data={MOCK_DATA} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    fireEvent.click(btn)  // second click — should be a no-op

    await waitFor(() => expect(btn).toBeDisabled())
    expect(mockGenerate).toHaveBeenCalledOnce()
  })

  // ── Success state ────────────────────────────────────────────────────────────

  it('passes the committed scenario savings to generateShareCard', async () => {
    mockGenerate.mockResolvedValue('blob:test-url')
    // Spy on anchor click so jsdom doesn't warn about navigation
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<ShareCardButton data={MOCK_DATA} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(mockGenerate).toHaveBeenCalled())
    const [tons, breakdown, savings] = mockGenerate.mock.calls[0]
    expect(tons).toBe(4.0)
    expect(breakdown).toEqual(MOCK_DATA.breakdown)
    expect(savings).toBe(18.5)   // committed.total_savings_tons

    clickSpy.mockRestore()
  })

  it('shows "Card downloaded!" after success', async () => {
    mockGenerate.mockResolvedValue('blob:test-url')
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<ShareCardButton data={MOCK_DATA} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText(/card downloaded/i)).toBeInTheDocument())
  })

  it('resets to idle after 3 seconds on success', async () => {
    mockGenerate.mockResolvedValue('blob:test-url')
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<ShareCardButton data={MOCK_DATA} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText(/card downloaded/i)).toBeInTheDocument())
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText(/share my impact/i)).toBeInTheDocument()
  })

  // ── Error state ──────────────────────────────────────────────────────────────

  it('shows "Try again" when generateShareCard rejects', async () => {
    mockGenerate.mockRejectedValue(new Error('Canvas 2D context unavailable'))

    render(<ShareCardButton data={MOCK_DATA} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument())
    // Button should be re-enabled (error state allows another attempt)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('resets to idle after 3 seconds on error', async () => {
    mockGenerate.mockRejectedValue(new Error('fail'))

    render(<ShareCardButton data={MOCK_DATA} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument())
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText(/share my impact/i)).toBeInTheDocument()
  })

  // ── Edge cases ───────────────────────────────────────────────────────────────

  it('falls back to 0 savings when no committed scenario exists', async () => {
    mockGenerate.mockResolvedValue('blob:test-url')
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const dataWithoutCommitted: ScenarioResponse = {
      ...MOCK_DATA,
      scenarios: MOCK_DATA.scenarios.filter(s => s.scenario_id !== 'committed'),
    }

    render(<ShareCardButton data={dataWithoutCommitted} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(mockGenerate).toHaveBeenCalled())
    const [, , savings] = mockGenerate.mock.calls[0]
    expect(savings).toBe(0)
  })
})
