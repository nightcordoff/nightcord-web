<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const config = useRuntimeConfig()

// Background canvas (shared across all pages)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { init: initCanvas, destroy: destroyCanvas } = useStarCanvas(canvasRef)

const headerVersion = ref('')
const headerHidden = ref(false)

// Dynamic header hide/show on scroll
let lastScrollY = 0
let isHidden = false

function onScroll() {
  const currentScrollY = window.scrollY
  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    if (!isHidden) { headerHidden.value = true; isHidden = true }
  } else if (currentScrollY < lastScrollY) {
    if (isHidden) { headerHidden.value = false; isHidden = false }
  }
  lastScrollY = currentScrollY
}

function onPointerMove(e: PointerEvent) {
  const atTop = window.scrollY < 100
  const isNearTop = e.clientY < 80
  const isFarFromTop = e.clientY > 220
  if (isNearTop) {
    headerHidden.value = false; isHidden = false
  } else if (!atTop && isFarFromTop && !isHidden) {
    headerHidden.value = true; isHidden = true
  }
}

onMounted(async () => {
  initCanvas()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('pointermove', onPointerMove as EventListener, { passive: true })

  // Load version from API (non-blocking, don't affect page load)
  try {
    const data = await $fetch<{ version?: string }>(`${config.public.apiBase}/api/overview`, {
      timeout: 5000,
    })
    if (data?.version) headerVersion.value = data.version
  } catch {}

  // Keep backend alive (ping every 14 min)
  const interval = setInterval(() => {
    fetch(`${config.public.apiBase}/api/health`).catch(() => {})
  }, 14 * 60 * 1000)

  onUnmounted(() => {
    destroyCanvas()
    clearInterval(interval)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('pointermove', onPointerMove as EventListener)
  })
})

function isActive(nav: string) {
  const path = route.path
  if (nav === 'home') return path === '/'
  return path.startsWith(`/${nav}`)
}
</script>

<template>
  <canvas class="fx-canvas" ref="canvasRef" aria-hidden="true"></canvas>
  <div class="backdrop-grid" aria-hidden="true"></div>
  <div class="aurora-wrap" aria-hidden="true">
    <div class="aurora aurora-a"></div>
  </div>
  <div class="site-shell">
    <header class="site-header glass" :class="{ 'is-hidden': headerHidden }">
      <NuxtLink class="brand" to="/">
        <img class="brand-mark" src="/image.png" alt="Nightcord logo" width="28" height="28">
        <span>Nightcord</span>
      </NuxtLink>
      <nav class="main-nav">
        <NuxtLink to="/" :class="{ 'is-active': isActive('home') }">Home</NuxtLink>
        <NuxtLink to="/plugins" :class="{ 'is-active': isActive('plugins') }">Plugins</NuxtLink>
        <NuxtLink to="/themes" :class="{ 'is-active': isActive('themes') }">Themes</NuxtLink>
        <NuxtLink to="/community" :class="{ 'is-active': isActive('community') }">Community</NuxtLink>
        <NuxtLink to="/project" :class="{ 'is-active': isActive('project') }">Project</NuxtLink>
      </nav>
      <NuxtLink class="header-download-btn" to="/download">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download <span v-if="headerVersion">{{ headerVersion }}</span>
      </NuxtLink>
    </header>

    <slot />

    <footer class="site-footer">
      <span>NightCord Official WebSite</span>
      <span>Nightcord. Not affiliated with Discord Inc.</span>
    </footer>
  </div>
</template>
