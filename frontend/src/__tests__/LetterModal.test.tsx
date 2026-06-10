/**
 * Unit tests for the LetterModal component.
 *
 * fetchLetter is mocked so no real network calls are made.
 * Tests cover: initial auto-fetch, loading state, success (typewriter),
 * error state with retry, scenario tab switching, and Escape-to-close.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { LetterModal } from '../components/LetterModal'
import type { ScenarioResponse } from '../types'

// ── Module mock ────────────────────────────────────────────────────────────────

vi.mock('../api/letter', () => ({
  fetchLetter: vi.fn(),
}))

import { fetchLetter } from '../api/letter'
const mockFetchLetter = vi.mocked(fetchLetter)

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
    year: 2050,
    annual_emissions_tons: 2.0,
    cumulative_emissions_tons: 70.0,
    equivalent_trees: 95,
    financial_cost_inr: 50000,
    narrative: 'Test 2050.',
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
      scenario_id: 'small',
      label: 'Small Steps',
      changes: ['Metro twice a week'],
      timeline: makeTimeline(),
      total_savings_tons: 5.2,
      total_savings_inr: 45000,
      summary: 'Small steps summary.',
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

const MOCK_LETTER_TEXT =
  'The air is different now.\n\nYou made the right choice in 2025.\n\nWith hope,\nYou — 2050'

function makeLetter(scenarioId = 'committed') {
  return {
    letter: MOCK_LETTER_TEXT,
    scenario_id: scenarioId,
    generated_at: '2050-01-01T00:00:00Z',
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('LetterModal', () => {
  beforeEach(() => {
    // shouldAdvanceTime keeps waitFor's internal polling alive while still allowing
    // manual time jumps with vi.advanceTimersByTime() for the typewriter intervals.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ── Rendering ────────────────────────────────────────────────────────────────

  it('renders the modal with correct heading', () => {
    mockFetchLetter.mockReturnValue(new Promise(() => {}))
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/letter from your 2050 self/i)).toBeInTheDocument()
  })

  it('has aria-modal and aria-label on the dialog', () => {
    mockFetchLetter.mockReturnValue(new Promise(() => {}))
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-label', 'Letter from your 2050 self')
  })

  it('renders three scenario tabs', () => {
    mockFetchLetter.mockReturnValue(new Promise(() => {}))
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)
    // tabs inside the letter modal header
    expect(screen.getByRole('tab', { name: /committed future/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /small steps/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /current path/i })).toBeInTheDocument()
  })

  // ── Auto-fetch on open ───────────────────────────────────────────────────────

  it('auto-fetches the "committed" scenario on mount', async () => {
    mockFetchLetter.mockResolvedValue(makeLetter('committed'))
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)

    await waitFor(() => expect(mockFetchLetter).toHaveBeenCalledOnce())
    expect(mockFetchLetter.mock.calls[0][0].scenario_id).toBe('committed')
  })

  it('does not fetch more than once on mount', async () => {
    mockFetchLetter.mockResolvedValue(makeLetter())
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)

    await waitFor(() => expect(mockFetchLetter).toHaveBeenCalledOnce())
  })

  // ── Loading state ────────────────────────────────────────────────────────────

  it('shows loading indicator while fetching', () => {
    // Never resolves — keeps component in loading state
    mockFetchLetter.mockReturnValue(new Promise(() => {}))
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)
    expect(screen.getByText(/writing your letter from 2050/i)).toBeInTheDocument()
  })

  it('disables scenario tabs while loading', () => {
    mockFetchLetter.mockReturnValue(new Promise(() => {}))
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)
    const tabs = screen.getAllByRole('tab')
    tabs.forEach(tab => expect(tab).toBeDisabled())
  })

  // ── Success / typewriter state ───────────────────────────────────────────────

  it('shows some letter text after fetch resolves', async () => {
    // Short letter so the typewriter can reveal it quickly in fake timers
    const shortLetter = 'Hello 2025.'
    mockFetchLetter.mockResolvedValue({ ...makeLetter(), letter: shortLetter })
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)

    // Wait for loading to clear
    await waitFor(() => expect(screen.queryByText(/writing your letter/i)).not.toBeInTheDocument())

    // Advance fake timers enough to reveal the whole letter (32 cps → ~344 ms)
    await act(async () => { vi.advanceTimersByTime(1000) })

    expect(screen.getByText(/hello 2025/i)).toBeInTheDocument()
  })

  it('passes the correct request fields to fetchLetter', async () => {
    mockFetchLetter.mockResolvedValue(makeLetter())
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)

    await waitFor(() => expect(mockFetchLetter).toHaveBeenCalled())
    const req = mockFetchLetter.mock.calls[0][0]
    expect(req.current_annual_tons).toBe(4.0)
    expect(req.dominant_category).toBe('transport')   // highest in breakdown
    expect(req.total_savings_tons).toBe(18.5)
    expect(req.scenario_id).toBe('committed')
  })

  // ── Error state ──────────────────────────────────────────────────────────────

  it('shows error message when fetchLetter rejects', async () => {
    mockFetchLetter.mockRejectedValue(new Error('Network error'))
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)

    await waitFor(() =>
      expect(screen.getByText(/could not generate your letter/i)).toBeInTheDocument()
    )
  })

  it('shows a "Try again" button on error', async () => {
    mockFetchLetter.mockRejectedValue(new Error('Network error'))
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    )
  })

  it('re-fetches when "Try again" is clicked', async () => {
    mockFetchLetter
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValue(makeLetter())

    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    await waitFor(() => expect(mockFetchLetter).toHaveBeenCalledTimes(2))
  })

  it('shows scenario-not-available error when scenario data is missing', async () => {
    const dataWithoutSmall: ScenarioResponse = {
      ...MOCK_DATA,
      scenarios: MOCK_DATA.scenarios.filter(s => s.scenario_id !== 'small'),
    }
    // Start with committed (succeeds), then switch to small (missing)
    mockFetchLetter.mockResolvedValue(makeLetter('committed'))

    render(<LetterModal data={dataWithoutSmall} onClose={vi.fn()} />)
    await waitFor(() => expect(mockFetchLetter).toHaveBeenCalledOnce())

    // Now switch to the missing scenario — no API call should happen
    fireEvent.click(screen.getByRole('tab', { name: /small steps/i }))
    await waitFor(() =>
      expect(screen.getByText(/scenario data for.*small steps.*is not available/i)).toBeInTheDocument()
    )
    // fetchLetter must NOT have been called a second time
    expect(mockFetchLetter).toHaveBeenCalledOnce()
  })

  // ── Scenario switching ───────────────────────────────────────────────────────

  it('marks the active tab as aria-selected="true"', () => {
    mockFetchLetter.mockReturnValue(new Promise(() => {}))
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)
    const committedTab = screen.getByRole('tab', { name: /committed future/i })
    expect(committedTab).toHaveAttribute('aria-selected', 'true')
  })

  it('fetches new scenario when a tab is clicked', async () => {
    mockFetchLetter.mockResolvedValue(makeLetter('committed'))
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)

    await waitFor(() => expect(mockFetchLetter).toHaveBeenCalledOnce())

    mockFetchLetter.mockResolvedValue(makeLetter('bau'))
    fireEvent.click(screen.getByRole('tab', { name: /current path/i }))

    await waitFor(() => expect(mockFetchLetter).toHaveBeenCalledTimes(2))
    expect(mockFetchLetter.mock.calls[1][0].scenario_id).toBe('bau')
  })

  it('updates the active tab indicator after switching', async () => {
    mockFetchLetter.mockResolvedValue(makeLetter())
    render(<LetterModal data={MOCK_DATA} onClose={vi.fn()} />)
    await waitFor(() => expect(mockFetchLetter).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('tab', { name: /small steps/i }))

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /small steps/i }))
        .toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: /committed future/i }))
        .toHaveAttribute('aria-selected', 'false')
    })
  })

  // ── Close behaviour ──────────────────────────────────────────────────────────

  it('calls onClose when the × button is clicked', () => {
    mockFetchLetter.mockReturnValue(new Promise(() => {}))
    const onClose = vi.fn()
    render(<LetterModal data={MOCK_DATA} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close letter/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the Escape key is pressed', () => {
    mockFetchLetter.mockReturnValue(new Promise(() => {}))
    const onClose = vi.fn()
    render(<LetterModal data={MOCK_DATA} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the backdrop is clicked', () => {
    mockFetchLetter.mockReturnValue(new Promise(() => {}))
    const onClose = vi.fn()
    render(<LetterModal data={MOCK_DATA} onClose={onClose} />)
    // The dialog element IS the backdrop (fixed inset-0)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does NOT call onClose when clicking inside the modal content', () => {
    mockFetchLetter.mockReturnValue(new Promise(() => {}))
    const onClose = vi.fn()
    render(<LetterModal data={MOCK_DATA} onClose={onClose} />)
    // Click the heading — it's inside the inner panel, not the backdrop
    fireEvent.click(screen.getByText(/letter from your 2050 self/i))
    expect(onClose).not.toHaveBeenCalled()
  })
})
