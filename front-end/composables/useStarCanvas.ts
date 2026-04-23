import { type Ref } from 'vue'

/**
 * Composable for the star/canvas background animation.
 * Runs on the main thread (CSS blur was the 3fps culprit, not the canvas).
 * 30fps cap + nebula gradient cache keep it lightweight.
 */

interface Star {
  x: number; y: number; radius: number
  baseAlpha: number; twinkleSpeed: number; twinkleOffset: number; colorIdx: 0 | 1 | 2
}
interface ShootingStar {
  x: number; y: number; vx: number; vy: number
  length: number; alpha: number; life: number; maxLife: number
}

const STAR_COUNT     = 160
const FRAME_INTERVAL = 1000 / 60
const COLORS = ['rgba(255,255,255,', 'rgba(180,200,255,', 'rgba(255,220,180,'] as const

export function useStarCanvas(canvasRef: Ref<HTMLCanvasElement | null>) {
  let animFrameId = 0
  let ctx: CanvasRenderingContext2D | null = null
  let W = 800, H = 600
  let lastFrameTime = 0, tick = 0
  let nextShooting = 60 + Math.random() * 120
  let lastNebulaX = -999, lastNebulaY = -999
  let cachedGrad1: CanvasGradient | null = null
  let fadeGrad: CanvasGradient | null = null
  const stars: Star[] = []
  const shootingStars: ShootingStar[] = []
  const pointer = { x: 400, y: 300 }
  const nebula   = { x: 400, y: 300 }
  let cleanupFns: (() => void)[] = []

  function makeStar(): Star {
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

  function makeShootingStar(): ShootingStar {
    const angle = Math.PI / 6 + Math.random() * Math.PI / 8
    const speed = 18 + Math.random() * 22
    return {
      x: Math.random() * W * 1.2, y: Math.random() * H * 0.5,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      length: 120 + Math.random() * 160,
      alpha: 1, life: 0, maxLife: 18 + Math.random() * 14,
    }
  }

  function resetStars() {
    stars.length = 0
    for (let i = 0; i < STAR_COUNT; i++) stars.push(makeStar())
  }

  function buildFadeGrad() {
    if (!ctx) return
    fadeGrad = ctx.createLinearGradient(0, H * 0.5, 0, H)
    fadeGrad.addColorStop(0, 'rgba(0,0,0,0)')
    fadeGrad.addColorStop(1, 'rgba(0,0,0,1)')
  }

  function animate(now: number) {
    if (!ctx) return
    animFrameId = requestAnimationFrame(animate)

    if (now - lastFrameTime < FRAME_INTERVAL) return
    lastFrameTime = now
    tick++

    ctx.clearRect(0, 0, W, H)

    // Nebula glow 1 — cached unless position changed > 4px
    nebula.x += (pointer.x - nebula.x) * 0.05
    nebula.y += (pointer.y - nebula.y) * 0.05
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

    // Nebula glow 2 — slow drift, drawn every frame (skip = visible flash)
    const nx2 = W * 0.8 + Math.sin(tick * 0.004) * 120
    const ny2 = H * 0.3 + Math.cos(tick * 0.003) * 80
    const g2 = ctx.createRadialGradient(nx2, ny2, 0, nx2, ny2, W * 0.4)
    g2.addColorStop(0, 'rgba(8,25,55,0.12)')
    g2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, W, H)

    // Stars
    for (const s of stars) {
      const alpha = Math.max(0.04, s.baseAlpha + Math.sin(tick * s.twinkleSpeed + s.twinkleOffset) * 0.3)
      ctx.beginPath()
      ctx.fillStyle = `${COLORS[s.colorIdx]}${alpha})`
      // Glow for brighter stars
      if (alpha > 0.5 && s.radius > 0.8) {
        ctx.shadowBlur = s.radius * 6
        ctx.shadowColor = `${COLORS[s.colorIdx]}0.8)`
      } else {
        ctx.shadowBlur = 0
      }
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.shadowBlur = 0

    // Shooting stars
    if (--nextShooting <= 0) {
      shootingStars.push(makeShootingStar())
      nextShooting = 80 + Math.random() * 100
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

    // Bottom fade — replaces CSS mask-image
    if (fadeGrad) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = fadeGrad
      ctx.fillRect(0, H * 0.5, W, H * 0.5)
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  function init() {
    if (typeof window === 'undefined') return
    const canvas = canvasRef.value
    if (!canvas) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dpr = Math.min(window.devicePixelRatio, 1.5)
    W = window.innerWidth
    H = window.innerHeight

    canvas.width  = W * dpr
    canvas.height = H * dpr
    canvas.style.width  = `${W}px`
    canvas.style.height = `${H}px`

    ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    pointer.x = W / 2; pointer.y = H / 2
    nebula.x  = W / 2; nebula.y  = H / 2

    buildFadeGrad()
    resetStars()
    animFrameId = requestAnimationFrame(animate)

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
    }

    const onResize = () => {
      if (!ctx) return
      const newDpr = Math.min(window.devicePixelRatio, 1.5)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W * newDpr
      canvas.height = H * newDpr
      canvas.style.width  = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(newDpr, 0, 0, newDpr, 0, 0)
      cachedGrad1 = null
      buildFadeGrad()
      resetStars()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('resize', onResize)
    cleanupFns.push(
      () => window.removeEventListener('pointermove', onPointerMove),
      () => window.removeEventListener('resize', onResize),
    )
  }

  function destroy() {
    cancelAnimationFrame(animFrameId)
    ctx = null
    cleanupFns.forEach(fn => fn())
    cleanupFns = []
  }

  return { init, destroy }
}
