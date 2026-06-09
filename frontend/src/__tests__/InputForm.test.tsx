import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InputForm } from '../components/InputForm'

describe('InputForm', () => {
  it('renders the form with all sections', () => {
    render(<InputForm onSubmit={vi.fn()} loading={false} />)
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Home Energy')).toBeInTheDocument()
    expect(screen.getByText('Shopping')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<InputForm onSubmit={vi.fn()} loading={false} />)
    expect(screen.getByRole('button', { name: /see my environmental future/i })).toBeInTheDocument()
  })

  it('disables submit button when loading', () => {
    render(<InputForm onSubmit={vi.fn()} loading={true} />)
    const btn = screen.getByRole('button', { name: /generating/i })
    expect(btn).toBeDisabled()
  })

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = vi.fn()
    render(<InputForm onSubmit={onSubmit} loading={false} />)
    fireEvent.submit(screen.getByRole('form', { name: /carbon footprint profile form/i }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('has accessible diet type radio buttons', () => {
    render(<InputForm onSubmit={vi.fn()} loading={false} />)
    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBe(4) // 4 diet options
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute('name', 'diet_type')
    })
  })

  it('renders car km input with correct label', () => {
    render(<InputForm onSubmit={vi.fn()} loading={false} />)
    expect(screen.getByLabelText(/car distance/i)).toBeInTheDocument()
  })

  it('has aria-busy when loading', () => {
    render(<InputForm onSubmit={vi.fn()} loading={true} />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })
})
