import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock the API module
vi.mock('../api/scenarios', () => ({
  generateScenarios: vi.fn(),
  checkHealth: vi.fn().mockResolvedValue(true),
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the app header', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('Carbon Time Machine')).toBeInTheDocument()
  })

  it('shows the hero heading on initial load', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /what does your 2040 look like/i })).toBeInTheDocument()
  })

  it('shows the input form by default', () => {
    render(<App />)
    expect(screen.getByRole('form', { name: /carbon footprint profile form/i })).toBeInTheDocument()
  })

  it('has skip-to-main-content link', () => {
    render(<App />)
    // In index.html, but we can check the main landmark
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('shows footer with attribution', () => {
    render(<App />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByText(/IPCC AR6/i)).toBeInTheDocument()
  })
})
