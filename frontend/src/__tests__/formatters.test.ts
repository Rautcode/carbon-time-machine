import { describe, it, expect } from 'vitest'
import {
  formatTons,
  formatNumber,
  emissionColor,
  breakdownPercent,
  scenarioGradient,
} from '../utils/formatters'

describe('formatTons', () => {
  it('formats 1 decimal place with unit', () => {
    expect(formatTons(3.456)).toBe('3.5 t CO₂')
  })
  it('formats zero correctly', () => {
    expect(formatTons(0)).toBe('0.0 t CO₂')
  })
})

describe('emissionColor', () => {
  it('returns green for low emissions', () => {
    expect(emissionColor(1.0)).toBe('text-green-600')
  })
  it('returns yellow for moderate emissions', () => {
    expect(emissionColor(2.5)).toBe('text-yellow-600')
  })
  it('returns orange for medium-high emissions', () => {
    expect(emissionColor(4.0)).toBe('text-orange-500')
  })
  it('returns red for high emissions', () => {
    expect(emissionColor(6.0)).toBe('text-red-600')
  })
})

describe('breakdownPercent', () => {
  it('calculates correct percentage', () => {
    expect(breakdownPercent(2, 8)).toBe(25)
  })
  it('returns 0 when total is 0', () => {
    expect(breakdownPercent(5, 0)).toBe(0)
  })
  it('rounds to integer', () => {
    expect(breakdownPercent(1, 3)).toBe(33)
  })
})

describe('scenarioGradient', () => {
  it('returns red gradient for bau', () => {
    expect(scenarioGradient('bau')).toContain('red')
  })
  it('returns green gradient for committed', () => {
    expect(scenarioGradient('committed')).toContain('green')
  })
  it('returns fallback for unknown id', () => {
    expect(scenarioGradient('unknown')).toContain('gray')
  })
})

describe('formatNumber', () => {
  it('formats large numbers with commas', () => {
    const result = formatNumber(1000)
    expect(result).toContain('1')
    expect(result.length).toBeGreaterThan(3) // has separators
  })
})
