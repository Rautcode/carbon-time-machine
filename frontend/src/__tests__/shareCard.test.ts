/**
 * Unit tests for the share card utilities.
 *
 * Pure-function tests (getPersonality, getDominantCategory) run without any
 * DOM setup. The generateShareCard integration test mocks the Canvas 2D context
 * because jsdom does not implement it natively.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getPersonality,
  getDominantCategory,
  generateShareCard,
} from '../utils/shareCard'

// ── getPersonality ─────────────────────────────────────────────────────────────

describe('getPersonality', () => {
  it('returns "Climate Leader" for footprint below 1.5 t', () => {
    expect(getPersonality(0).label).toBe('Climate Leader')
    expect(getPersonality(1.4).label).toBe('Climate Leader')
  })

  it('returns "Urban Optimizer" for footprint in [1.5, 2.5)', () => {
    expect(getPersonality(1.5).label).toBe('Urban Optimizer')
    expect(getPersonality(2.4).label).toBe('Urban Optimizer')
  })

  it('returns "Reluctant Reformer" for footprint in [2.5, 4.0)', () => {
    expect(getPersonality(2.5).label).toBe('Reluctant Reformer')
    expect(getPersonality(3.9).label).toBe('Reluctant Reformer')
  })

  it('returns "Carbon Aware" for footprint in [4.0, 6.0)', () => {
    expect(getPersonality(4.0).label).toBe('Carbon Aware')
    expect(getPersonality(5.9).label).toBe('Carbon Aware')
  })

  it('returns "Change Opportunity" for footprint >= 6.0 t', () => {
    expect(getPersonality(6.0).label).toBe('Change Opportunity')
    expect(getPersonality(20.0).label).toBe('Change Opportunity')
    expect(getPersonality(Infinity).label).toBe('Change Opportunity')
  })

  it('every tier has a non-empty accent hex colour', () => {
    for (const tons of [0, 1.5, 2.5, 4.0, 6.0]) {
      const p = getPersonality(tons)
      expect(p.accent).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('every tier has a non-empty emoji', () => {
    for (const tons of [0, 1.5, 2.5, 4.0, 6.0]) {
      expect(getPersonality(tons).emoji.length).toBeGreaterThan(0)
    }
  })
})

// ── getDominantCategory ────────────────────────────────────────────────────────

describe('getDominantCategory', () => {
  it('returns the key with the highest value', () => {
    expect(getDominantCategory({ transport: 3.0, food: 1.0, energy: 0.5 })).toBe('transport')
  })

  it('returns "energy" for an empty breakdown', () => {
    expect(getDominantCategory({})).toBe('energy')
  })

  it('handles a single-entry breakdown', () => {
    expect(getDominantCategory({ food: 2.5 })).toBe('food')
  })

  it('handles ties by returning last-seen maximum (insertion order)', () => {
    // Both shopping and digital are equal — we just confirm it returns one of them
    const result = getDominantCategory({ transport: 1.0, shopping: 2.0, digital: 2.0 })
    expect(['shopping', 'digital']).toContain(result)
  })

  it('handles zero-value entries without selecting them over positive ones', () => {
    expect(getDominantCategory({ transport: 0, food: 0, energy: 0.1 })).toBe('energy')
  })

  it('handles negative values (credit/offset categories) without crashing', () => {
    // getDominantCategory is not responsible for filtering negatives — it just finds max
    const result = getDominantCategory({ transport: -1, energy: 0.5 })
    expect(result).toBe('energy')
  })
})

// ── generateShareCard ──────────────────────────────────────────────────────────

/**
 * Build a minimal CanvasRenderingContext2D mock that satisfies every method
 * called inside generateShareCard.
 */
function makeCtxMock(): CanvasRenderingContext2D {
  const gradient = { addColorStop: vi.fn() }
  return {
    fillRect:             vi.fn(),
    beginPath:            vi.fn(),
    arc:                  vi.fn(),
    fill:                 vi.fn(),
    stroke:               vi.fn(),
    moveTo:               vi.fn(),
    lineTo:               vi.fn(),
    quadraticCurveTo:     vi.fn(),
    closePath:            vi.fn(),
    fillText:             vi.fn(),
    save:                 vi.fn(),
    restore:              vi.fn(),
    translate:            vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue(gradient),
    createRadialGradient: vi.fn().mockReturnValue(gradient),
    // writable style properties
    fillStyle:   '',
    strokeStyle: '',
    font:        '',
    textAlign:   'start',
    shadowColor: '',
    shadowBlur:  0,
    lineWidth:   1,
  } as unknown as CanvasRenderingContext2D
}

describe('generateShareCard', () => {
  let originalCreateElement: typeof document.createElement
  let originalCreateObjectURL: typeof URL.createObjectURL
  let originalRevokeObjectURL: typeof URL.revokeObjectURL

  beforeEach(() => {
    originalCreateElement    = document.createElement.bind(document)
    originalCreateObjectURL  = URL.createObjectURL
    originalRevokeObjectURL  = URL.revokeObjectURL

    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    document.createElement  = originalCreateElement
    URL.createObjectURL     = originalCreateObjectURL
    URL.revokeObjectURL     = originalRevokeObjectURL
    vi.restoreAllMocks()
  })

  it('rejects with a descriptive error when the 2D context is unavailable', async () => {
    // jsdom does not implement Canvas 2D — getContext returns null naturally
    await expect(
      generateShareCard(4.0, { transport: 2, food: 1, energy: 0.5, shopping: 0.3, digital: 0.2 }, 12)
    ).rejects.toThrow('Canvas 2D context unavailable')
  })

  it('resolves with a blob object-URL when the context is available', async () => {
    // Patch document.createElement to return a mock canvas
    const blob = new Blob(['png-data'], { type: 'image/png' })
    const mockCanvas = {
      width:      0,
      height:     0,
      getContext: vi.fn().mockReturnValue(makeCtxMock()),
      toBlob:     vi.fn((cb: BlobCallback) => cb(blob)),
    }
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
      return originalCreateElement(tag)
    })

    const url = await generateShareCard(
      4.0,
      { transport: 2, food: 1, energy: 0.5, shopping: 0.3, digital: 0.2 },
      12,
    )
    expect(url).toBe('blob:mock-url')
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
  })

  it('rejects when toBlob returns null', async () => {
    const mockCanvas = {
      width:      0,
      height:     0,
      getContext: vi.fn().mockReturnValue(makeCtxMock()),
      toBlob:     vi.fn((cb: BlobCallback) => cb(null)),
    }
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
      return originalCreateElement(tag)
    })

    await expect(
      generateShareCard(4.0, {}, 0)
    ).rejects.toThrow('canvas.toBlob returned null')
  })

  it('does not throw for edge-case inputs (0 tons, empty breakdown, 0 savings)', async () => {
    const mockCanvas = {
      width:      0,
      height:     0,
      getContext: vi.fn().mockReturnValue(makeCtxMock()),
      toBlob:     vi.fn((cb: BlobCallback) => cb(new Blob(['x']))),
    }
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
      return originalCreateElement(tag)
    })

    await expect(
      generateShareCard(0, {}, 0)
    ).resolves.toBeDefined()
  })

  it('does not throw for NaN / negative input (clamped by safeTons)', async () => {
    const mockCanvas = {
      width:      0,
      height:     0,
      getContext: vi.fn().mockReturnValue(makeCtxMock()),
      toBlob:     vi.fn((cb: BlobCallback) => cb(new Blob(['x']))),
    }
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
      return originalCreateElement(tag)
    })

    await expect(
      generateShareCard(NaN, { transport: 1 }, 5)
    ).resolves.toBeDefined()
  })
})
