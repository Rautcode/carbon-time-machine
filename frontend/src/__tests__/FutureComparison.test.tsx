import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FutureComparison } from '../components/FutureComparison'
import type { ScenarioResponse } from '../types'

const makeTimeline = () => [
  {
    year: 2030,
    annual_emissions_tons: 4.2,
    cumulative_emissions_tons: 21.0,
    equivalent_trees: 200,
    financial_cost_inr: 85000,
    narrative: 'Narrative 2030.',
  },
  {
    year: 2035,
    annual_emissions_tons: 4.6,
    cumulative_emissions_tons: 44.0,
    equivalent_trees: 219,
    financial_cost_inr: 103000,
    narrative: 'Narrative 2035.',
  },
  {
    year: 2040,
    annual_emissions_tons: 5.1,
    cumulative_emissions_tons: 70.0,
    equivalent_trees: 243,
    financial_cost_inr: 125000,
    narrative: 'Narrative 2040.',
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

describe('FutureComparison', () => {
  it('renders the section heading', () => {
    render(<FutureComparison data={MOCK_DATA} onReset={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /your environmental future/i })).toBeInTheDocument()
  })

  it('renders three scenario tabs', () => {
    render(<FutureComparison data={MOCK_DATA} onReset={vi.fn()} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(MOCK_DATA.scenarios.length)
  })

  it('BAU tab is selected by default', () => {
    render(<FutureComparison data={MOCK_DATA} onReset={vi.fn()} />)
    const bauTab = screen.getByRole('tab', { name: /current path/i })
    expect(bauTab).toHaveAttribute('aria-selected', 'true')
  })

  it('clicking a tab changes selection', () => {
    render(<FutureComparison data={MOCK_DATA} onReset={vi.fn()} />)
    const committedTab = screen.getByRole('tab', { name: /committed future/i })
    fireEvent.click(committedTab)
    expect(committedTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders breakdown bars with correct aria labels', () => {
    render(<FutureComparison data={MOCK_DATA} onReset={vi.fn()} />)
    expect(screen.getByRole('progressbar', { name: /transport/i })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /food/i })).toBeInTheDocument()
  })

  it('calls onReset when Start Over clicked', () => {
    const onReset = vi.fn()
    render(<FutureComparison data={MOCK_DATA} onReset={onReset} />)
    fireEvent.click(screen.getByRole('button', { name: /start over/i }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('shows savings for non-BAU scenarios', () => {
    render(<FutureComparison data={MOCK_DATA} onReset={vi.fn()} />)
    // Click Small Steps tab first so its panel is active and text is visible
    fireEvent.click(screen.getByRole('tab', { name: /small steps/i }))
    expect(screen.getByText(/Save 5.2t by 2040/i)).toBeInTheDocument()
  })

  it('has tabpanel roles', () => {
    render(<FutureComparison data={MOCK_DATA} onReset={vi.fn()} />)
    // inactive panels use the HTML `hidden` attribute — query with hidden:true to include them
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(MOCK_DATA.scenarios.length)
  })
})
