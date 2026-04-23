/// <reference lib="webworker" />

// ─── State ───────────────────────────────────────────────────────────────────
let animFrameId = 0
let ctx: OffscreenCanvasRenderingContext2D | null = null
let W = 800
let H = 600

const stars: {
  x: number; y: number; radius: number
  baseAlpha: number; twinkleSpeed: number; twinkleOffset: number; colorIdx: 0 | 1 | 2
}[] = []
const shootingStars: {
  x: number; y: number; vx: number; vy: number
  length: number; alpha: number; life: number; maxLife: number
}[] = []

const pointer = { x: 400, y: 300 }
const nebula   = { x: 400, y: 300 }

const STAR_COUNT     = 160
const FRAME_INTERVAL = 1000 / 30   // 30 fps cap — plenty for a background

let lastFrameTime = 0
let tick = 0
let nextShooting = 180 + Math.random() * 240
let lastNebulaX = -999, lastNebulaY = -999
let cachedGrad1: CanvasGradient | null = null
let fadeGrad:    CanvasGradient | null = null

const COLORS = ['rgba(255,255,255,', 'rgba(180,200,255,', 'rgba(255,220,180,'] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeStar() {
  const r = Math.random()
  return {
    x: Math.random() * W, y: Math.random() * H,
    radius: 0.3 + Math.random() * 1.4,
    baseAlpha: 0.1 + Math.random() * 0.55,
    twinkleSpeed: 0.004 + Math.random() * 0.018,
    twinkleOffset: Math.random() * Math.PI * 2,
    colorIdx: (r > 0.88 ? 1 : r > 0.75 ? 2 : 0) as 0 | 1 | 2,
  }
}

function makeShootingStar() {
  const angle = Math.PI / 6 + Math.random() * Math.PI / 8
  const speed = 6 + Math.random() * 10
  return {
    x: Math.random() * W * 1.2, y: Math.random() * H * 0.5,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    length: 80 + Math.random() * 140,
    alpha: 1, life: 0, maxLife: 40 + Math.random() * 30,
  }
}

function resetStars() {
  stars.length = 0
  for (let i = 0; i < STAR_COUNT; i++) stars.push(makeStar())
}

/** Precompute bottom-fade gradient (replaces CSS mask-image) */
function buildFadeGrad() {
  if (!ctx) return
  fadeGrad = ctx.createLinearGradient(0, H * 0.5, 0, H)
  fadeGrad.addColorStop(0, 'rgba(0,0,0,0)')
  fadeGrad.addColorStop(1, 'rgba(0,0,0,1)')
}

// ─── Animation loop ───────────────────────────────────────────────────────────
function animate(now: number) {
  if (!ctx) return
  animFrameId = requestAnimationFrame(animate)

  // 30 fps gate
  if (now - lastFrameTime < FRAME_INTERVAL) return
  lastFrameTime = now
  tick++

  ctx.clearRect(0, 0, W, H)

  // Nebula glow 1 — cached unless position changed > 4px
  nebula.x += (pointer.x - nebula.x) * 0.025
  nebula.y += (pointer.y - nebula.y) * 0.025
  const dx = nebula.x - lastNebulaX, dy = nebula.y - lastNebulaY
  if (!cachedGrad1 || dx * dx + dy * dy > 16) {
    cachedGrad1 = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, W * 0.55)
    cachedGrad1.addColorStop(0, 'rgba(8,25,55,0.18)')
    cachedGrad1.addColorStop(0.4, 'rgba(8,25,55,0.09)')
    cachedGrad1.addColorStop(1, 'rgba(0,0,0,0)')
    lastNebulaX = nebula.x; lastNebulaY = nebula.y
  }
  ctx.fillStyle = cachedGrad1
  ctx.fillRect(0, 0, W, H)

  // Nebula glow 2 — slow drift, only every 3 ticks
  if (tick % 3 === 0) {
    const nx2 = W * 0.8 + Math.sin(tick * 0.004) * 120
    const ny2 = H * 0.3 + Math.cos(tick * 0.003) * 80
    const g2 = ctx.createRadialGradient(nx2, ny2, 0, nx2, ny2, W * 0.4)
    g2.addColorStop(0, 'rgba(8,25,55,0.12)')
    g2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, W, H)
  }

  // Stars
  for (const s of stars) {
    const alpha = Math.max(0.04, s.baseAlpha + Math.sin(tick * s.twinkleSpeed + s.twinkleOffset) * 0.22)
    ctx.beginPath()
    ctx.fillStyle = `${COLORS[s.colorIdx]}${alpha})`
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // Shooting stars
  if (--nextShooting <= 0) {
    shootingStars.push(makeShootingStar())
    nextShooting = 200 + Math.random() * 300
  }
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i]
    s.x += s.vx; s.y += s.vy; s.life++
    s.alpha = Math.max(0, 1 - s.life / s.maxLife)
    const h = Math.hypot(s.vx, s.vy)
    const tx = s.x - (s.vx * s.length) / h
    const ty = s.y - (s.vy * s.length) / h
    const sg = ctx.createLinearGradient(tx, ty, s.x, s.y)
    sg.addColorStop(0, 'rgba(255,255,255,0)')
    sg.addColorStop(1, `rgba(255,255,255,${s.alpha * 0.85})`)
    ctx.beginPath()
    ctx.strokeStyle = sg
    ctx.lineWidth = 1.2
    ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y)
    ctx.stroke()
    if (s.life >= s.maxLife) shootingStars.splice(i, 1)
  }

  // Bottom fade — replaces CSS mask-image (no compositing overhead on the page)
  if (fadeGrad) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = fadeGrad
    ctx.fillRect(0, H * 0.5, W, H * 0.5)
    ctx.globalCompositeOperation = 'source-over'
  }
}

// ─── Message handler ──────────────────────────────────────────────────────────
self.onmessage = (e: MessageEvent) => {
  const msg = e.data as {
    type: 'init' | 'pointer' | 'resize' | 'destroy'
    canvas?: OffscreenCanvas
    cssWidth?: number; cssHeight?: number; dpr?: number
    x?: number; y?: number
  }

  switch (msg.type) {
    case 'init': {
      const { canvas, cssWidth = 800, cssHeight = 600, dpr = 1 } = msg
      ctx = canvas!.getContext('2d', { alpha: true })!
      W = cssWidth; H = cssHeight
      pointer.x = W / 2; pointer.y = H / 2
      nebula.x  = W / 2; nebula.y  = H / 2
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildFadeGrad()
      resetStars()
      animFrameId = requestAnimationFrame(animate)
      break
    }
    case 'pointer': {
      pointer.x = msg.x!; pointer.y = msg.y!
      break
    }
    case 'resize': {
      const { cssWidth = W, cssHeight = H, dpr = 1 } = msg
      if (!ctx) break
      ;(ctx.canvas as OffscreenCanvas).width  = cssWidth  * dpr
      ;(ctx.canvas as OffscreenCanvas).height = cssHeight * dpr
      W = cssWidth; H = cssHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cachedGrad1 = null; fadeGrad = null
      buildFadeGrad()
      resetStars()
      break
    }
    case 'destroy': {
      cancelAnimationFrame(animFrameId)
      break
    }
  }
}
