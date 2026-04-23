<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

useHead({
  title: 'Download — Nightcord',
  meta: [{ name: 'description', content: 'Download Nightcord for Windows and Linux.' }]
})

const config = useRuntimeConfig()

const version = ref('latest')
const winUrl = ref('https://github.com/nightcordoff/nightcordclient-releases/releases/latest')
const linUrl = ref('https://github.com/nightcordoff/nightcordclient-releases/releases/latest')
const stableCount = ref(0)
const loading = ref(true)

const { init: initReveal, destroy: destroyReveal } = useScrollReveal()
onUnmounted(() => destroyReveal())

onMounted(async () => {
  const firebaseUrl = config.public.firebaseUrl

  // FIX: Both calls run in parallel
  const [releaseResult, countResult] = await Promise.allSettled([
    fetch('https://api.github.com/repos/nightcordoff/nightcordclient-releases/releases/latest')
      .then(r => r.json()),
    fetch(`${firebaseUrl}/downloads/count.json`).then(r => r.json()),
  ])

  if (releaseResult.status === 'fulfilled') {
    const data = releaseResult.value
    version.value = data?.tag_name || 'latest'
    const exe = data?.assets?.find((a: any) => a.name.endsWith('.exe'))
    const appimage = data?.assets?.find((a: any) => a.name.endsWith('.AppImage'))
    if (exe?.browser_download_url) winUrl.value = exe.browser_download_url
    if (appimage?.browser_download_url) linUrl.value = appimage.browser_download_url
  }

  if (countResult.status === 'fulfilled') {
    stableCount.value = Number(countResult.value) || 0
  }

  loading.value = false
  await import('vue').then(({ nextTick }) => nextTick())
  initReveal()
})

async function trackDownload(_platform: string) {
  if (!import.meta.client) return
  const now = Date.now()
  const LIMIT = 30 * 60 * 1000
  const MAX = 10
  let hist: number[] = JSON.parse(localStorage.getItem('nc_dl_history') || '[]')
  hist = hist.filter((t: number) => now - t < LIMIT)
  if (hist.length >= MAX) return
  hist.push(now)
  localStorage.setItem('nc_dl_history', JSON.stringify(hist))
  stableCount.value += 1
  const firebaseUrl = config.public.firebaseUrl
  fetch(`${firebaseUrl}/downloads/count.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ '.sv': { increment: 1 } }),
    keepalive: true,
  }).catch(() => {})
}
</script>

<template>
  <main class="page page-download" data-reveal>
    <section class="hero hero-inner">
      <div class="hero-copy">
        <p class="eyebrow">Download</p>
        <h1>Get Nightcord.</h1>
        <p class="hero-text">Available for Windows and Linux.</p>
      </div>
    </section>

    <section class="download-section" data-reveal>
      <div v-if="loading" class="download-loading">Loading release info…</div>
      <div v-else class="download-grid" id="download-grid">
        <!-- Windows -->
        <article class="download-card glass" data-channel="stable">
          <span class="feature-chip">Windows</span>
          <h3>Download {{ version }}</h3>
          <p>Main Nightcord installer (.exe).</p>
          <small>Downloads: {{ new Intl.NumberFormat('en-US').format(stableCount) }}</small>
          <div class="download-card-spacer" />
          <a
            class="button button-primary"
            :href="winUrl"
            target="_blank"
            rel="noopener noreferrer"
            @click="trackDownload('windows')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.949"/>
            </svg>
            Download {{ version }}
          </a>
        </article>

        <!-- Linux -->
        <article class="download-card glass" data-channel="linux">
          <span class="feature-chip">Linux</span>
          <h3>Download {{ version }}</h3>
          <p>AppImage — works on most distros.</p>
          <small>Downloads: —</small>
          <div class="download-card-spacer" />
          <a
            class="button button-primary"
            :href="linUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download {{ version }}
          </a>
        </article>
      </div>
    </section>
  </main>
</template>
