/**
 * Canvas-based share card generator.
 * Produces a 1080×1080 PNG blob URL — no external dependencies.
 */

const W = 1080
const H = 1080

/** India average per-capita footprint (tons CO₂e/year, MoEFCC 2023) */
const INDIA_AVG_TONS = 1.9
/** Paris 1.5°C compatible per-capita budget */
const PARIS_TONS = 2.0

const CATEGORY_LABELS: Record<string, string> = {
  transport: '🚗 Transport',
  food:      '🍽 Food',
  energy:    '⚡ Energy',
  shopping:  '🛍 Shopping',
  digital:   '📱 Digital',
}

interface Personality {
  label:   string
  emoji:   string
  accent:  string   // hex — pill border + glow
  pillBg:  string   // semi-transparent fill
}

const PERSONALITIES: Array<{ maxTons: number } & Personality> = [
  { maxTons: 1.5,      label: 'Climate Leader',      emoji: '🌿', accent: '#10b981', pillBg: '#10b98122' },
  { maxTons: 2.5,      label: 'Urban Optimizer',      emoji: '⚡', accent: '#38bdf8', pillBg: '#38bdf822' },
  { maxTons: 4.0,      label: 'Reluctant Reformer',   emoji: '🚶', accent: '#fbbf24', pillBg: '#fbbf2422' },
  { maxTons: 6.0,      label: 'Carbon Aware',          emoji: '🔄', accent: '#fb923c', pillBg: '#fb923c22' },
  { maxTons: Infinity, label: 'Change Opportunity',   emoji: '🔴', accent: '#f87171', pillBg: '#f8717122' },
]

function getPersonality(tons: number): Personality {
  return PERSONALITIES.find(p => tons < p.maxTons) ?? PERSONALITIES[PERSONALITIES.length - 1]
}

function getDominantCategory(breakdown: Record<string, number>): string {
  const entries = Object.entries(breakdown)
  if (entries.length === 0) return 'energy'
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
}

/** Draw a rounded rectangle path (does not fill/stroke — caller does that) */
function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  const clampedR = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + clampedR, y)
  ctx.lineTo(x + w - clampedR, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + clampedR)
  ctx.lineTo(x + w, y + h - clampedR)
  ctx.quadraticCurveTo(x + w, y + h, x + w - clampedR, y + h)
  ctx.lineTo(x + clampedR, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - clampedR)
  ctx.lineTo(x, y + clampedR)
  ctx.quadraticCurveTo(x, y, x + clampedR, y)
  ctx.closePath()
}

/** Draw one comparison bar row */
function drawBar(
  ctx: CanvasRenderingContext2D,
  label: string,
  valueTons: number,
  maxTons: number,
  y: number,
  accent: string,
  isUser: boolean,
): void {
  const LABEL_W = 240
  const BAR_X   = LABEL_W + 40
  const BAR_MAX  = W - BAR_X - 160  // leave room for value text
  const BAR_H    = 40
  const BAR_R    = BAR_H / 2

  const fillW = Math.min(BAR_MAX, Math.max(BAR_R * 2, (valueTons / maxTons) * BAR_MAX))

  // Label
  ctx.fillStyle = isUser ? '#ffffff' : 'rgba(255,255,255,0.55)'
  ctx.font      = isUser ? 'bold 34px system-ui' : '32px system-ui'
  ctx.textAlign = 'right'
  ctx.fillText(label, LABEL_W, y + BAR_H / 2 + 11)

  // Track
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  rrect(ctx, BAR_X, y, BAR_MAX, BAR_H, BAR_R)
  ctx.fill()

  // Fill
  ctx.fillStyle = accent
  rrect(ctx, BAR_X, y, fillW, BAR_H, BAR_R)
  ctx.fill()

  // Value
  ctx.fillStyle = isUser ? '#ffffff' : 'rgba(255,255,255,0.6)'
  ctx.font      = isUser ? 'bold 32px system-ui' : '30px system-ui'
  ctx.textAlign = 'left'
  ctx.fillText(`${valueTons.toFixed(1)} t`, BAR_X + BAR_MAX + 16, y + BAR_H / 2 + 11)
}

/**
 * Generate a 1080×1080 carbon identity card.
 * @returns Object URL for the PNG blob (caller must call URL.revokeObjectURL when done)
 */
export async function generateShareCard(
  currentTons: number,
  breakdown: Record<string, number>,
  committedSavingsTons: number,
): Promise<string> {
  const canvas  = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // Clamp inputs so negative/NaN values from upstream bugs don't corrupt canvas draws
  const safeTons    = Math.max(0, isFinite(currentTons) ? currentTons : 0)
  const personality   = getPersonality(safeTons)
  const dominantCat   = getDominantCategory(breakdown)
  const dominantLabel = CATEGORY_LABELS[dominantCat] ?? dominantCat
  // +0.01 prevents division-by-zero in drawBar when all values are 0
  const maxBarTons    = Math.max(safeTons, INDIA_AVG_TONS, PARIS_TONS, 0.01) * 1.15

  // ── Background ─────────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H)
  bgGrad.addColorStop(0, '#080f1a')
  bgGrad.addColorStop(1, '#0b1f14')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // Dot grid
  ctx.fillStyle = 'rgba(255,255,255,0.055)'
  for (let gx = 70; gx < W; gx += 90) {
    for (let gy = 70; gy < H; gy += 90) {
      ctx.beginPath()
      ctx.arc(gx, gy, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Radial glow behind number
  const glow = ctx.createRadialGradient(W / 2, 310, 0, W / 2, 310, 360)
  glow.addColorStop(0, `${personality.accent}18`)
  glow.addColorStop(1, 'rgba(0,0,0,0)')   // 'transparent' is not valid in Canvas API
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // ── App name ───────────────────────────────────────────────────────────────
  ctx.fillStyle  = 'rgba(255,255,255,0.32)'
  ctx.font       = '500 36px system-ui'
  ctx.textAlign  = 'center'
  ctx.fillText('carbon • time • machine', W / 2, 88)

  // Top divider
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(100, 108)
  ctx.lineTo(W - 100, 108)
  ctx.stroke()

  // ── Main footprint number ──────────────────────────────────────────────────
  ctx.shadowColor = personality.accent
  ctx.shadowBlur  = 48
  ctx.fillStyle   = '#ffffff'
  ctx.font        = 'bold 196px system-ui'
  ctx.textAlign   = 'center'
  ctx.fillText(safeTons.toFixed(1), W / 2, 370)   // use safeTons — never renders "NaN"
  ctx.shadowBlur  = 0

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font      = '48px system-ui'
  ctx.fillText('tons CO₂ per year', W / 2, 444)

  // ── Personality pill ───────────────────────────────────────────────────────
  const pillText = `${personality.emoji}  ${personality.label}`
  const pillW = 460, pillH = 74, pillX = (W - pillW) / 2, pillY = 490

  ctx.fillStyle = personality.pillBg
  rrect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
  ctx.fill()
  ctx.strokeStyle = personality.accent
  ctx.lineWidth   = 2
  rrect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
  ctx.stroke()

  ctx.fillStyle  = personality.accent
  ctx.font       = 'bold 37px system-ui'
  ctx.textAlign  = 'center'
  ctx.fillText(pillText, W / 2, pillY + 48)

  // Dominant category tag
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font      = '30px system-ui'
  ctx.fillText(`Top source: ${dominantLabel}`, W / 2, pillY + pillH + 36)

  // ── Comparison bars ────────────────────────────────────────────────────────
  const BAR_SECTION_Y = 690

  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.font      = '28px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('H O W   Y O U   C O M P A R E', W / 2, BAR_SECTION_Y - 16)

  ctx.save()
  ctx.translate(100, 0)   // indent bars from left edge
  drawBar(ctx, 'You',          safeTons,       maxBarTons, BAR_SECTION_Y,       personality.accent, true)
  drawBar(ctx, 'India avg',    INDIA_AVG_TONS, maxBarTons, BAR_SECTION_Y + 68,  '#6b7280',          false)
  drawBar(ctx, 'Paris 1.5°C', PARIS_TONS,      maxBarTons, BAR_SECTION_Y + 136, '#10b981',          false)
  ctx.restore()

  // ── Savings / CTA box ──────────────────────────────────────────────────────
  const ctaY = 880
  if (committedSavingsTons > 0.1) {
    ctx.fillStyle   = 'rgba(16,185,129,0.12)'
    rrect(ctx, 100, ctaY, W - 200, 118, 22)
    ctx.fill()
    ctx.strokeStyle = 'rgba(16,185,129,0.35)'
    ctx.lineWidth   = 1.5
    rrect(ctx, 100, ctaY, W - 200, 118, 22)
    ctx.stroke()

    ctx.fillStyle = '#10b981'
    ctx.font      = 'bold 38px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(
      `🌿  Committed path → save ${committedSavingsTons.toFixed(1)} t by 2040`,
      W / 2, ctaY + 50,
    )
    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.font      = '28px system-ui'
    ctx.fillText('Your individual choice compounds into city-scale change', W / 2, ctaY + 92)
  }

  // ── Bottom bar ─────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.09)'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(100, 1020)
  ctx.lineTo(W - 100, 1020)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.font      = '28px system-ui'
  ctx.textAlign = 'left'
  ctx.fillText('carbon-time-machine', 100, 1058)
  ctx.textAlign = 'right'
  ctx.fillText('#MyCarbonFootprint', W - 100, 1058)

  // ── Export blob ────────────────────────────────────────────────────────────
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('canvas.toBlob returned null')); return }
        resolve(URL.createObjectURL(blob))
      },
      'image/png',
    )
  })
}
