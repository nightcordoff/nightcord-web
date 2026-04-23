<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

useHead({
  title: 'Nightcord',
  meta: [
    { name: 'description', content: 'Nightcord is a Discord client packed with powerful features Discord never gave you.' }
  ]
})

const config = useRuntimeConfig()

// Canvas ref
// (moved to layout — shared across all pages)

// Data state
const overview = ref<any>(null)
const downloadCount = ref(0)
const winDownloadUrl = ref('/download')

// Contribute modal
const contributeOpen = ref(false)
const contributeStatus = ref('Choose a contact or wallet to copy')
let contributeTimeout: ReturnType<typeof setTimeout> | null = null

// Feature toggles (visual demo only)
const featureToggles = ref<Record<string, boolean>>({ AntiDeco: true, VoiceDictation: true })

function openContribute() {
  contributeOpen.value = true
  contributeStatus.value = 'Choose a contact or wallet to copy'
}
function closeContribute() { contributeOpen.value = false }

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value)
    contributeStatus.value = `${label} copied`
    if (contributeTimeout) clearTimeout(contributeTimeout)
    contributeTimeout = setTimeout(() => {
      contributeStatus.value = 'Ready to copy'
    }, 1800)
  } catch {
    contributeStatus.value = 'Failed to copy'
  }
}

function animateCounter(target: number) {
  const duration = 1200
  const start = performance.now()
  const current = downloadCount.value
  function update(now: number) {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    downloadCount.value = Math.floor(current + eased * (target - current))
    if (progress < 1) requestAnimationFrame(update)
    else downloadCount.value = target
  }
  requestAnimationFrame(update)
}

// Rate-limited download click
async function onWindowsDownload() {
  if (!import.meta.client) return
  const now = Date.now()
  const LIMIT_WINDOW = 30 * 60 * 1000
  const MAX_CLICKS = 10
  let history: number[] = JSON.parse(localStorage.getItem('nc_dl_history') || '[]')
  history = history.filter((t: number) => now - t < LIMIT_WINDOW)
  if (history.length >= MAX_CLICKS) return

  downloadCount.value += 1
  history.push(now)
  localStorage.setItem('nc_dl_history', JSON.stringify(history))

  const firebaseUrl = config.public.firebaseUrl
  fetch(`${firebaseUrl}/downloads/count.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ '.sv': { increment: 1 } }),
    keepalive: true,
  }).catch(() => {})
}

// Scroll reveal
const { init: initReveal, destroy: destroyReveal } = useScrollReveal()

onMounted(async () => {
  await nextTick()
  initReveal()

  // Load backend data (non-blocking — page renders immediately)
  $fetch<any>(`${config.public.apiBase}/api/overview`, { timeout: 6000 })
    .then(data => { overview.value = data })
    .catch(() => {})

  // Load download count from Firebase (non-blocking)
  const firebaseUrl = config.public.firebaseUrl
  fetch(`${firebaseUrl}/downloads/count.json`)
    .then(r => r.json())
    .then((val: number) => animateCounter(Number(val) || 0))
    .catch(() => {})

  // Load GitHub release URL (non-blocking)
  fetch('https://api.github.com/repos/nightcordoff/nightcordclient-releases/releases/latest')
    .then(r => r.json())
    .then((data: any) => {
      const exe = data?.assets?.find((a: any) => a.name.endsWith('.exe'))
      if (exe?.browser_download_url) winDownloadUrl.value = exe.browser_download_url
    })
    .catch(() => {})
})

onUnmounted(() => {
  destroyReveal()
  if (contributeTimeout) clearTimeout(contributeTimeout)
})

const FEATURED = new Set(['AntiDeco', 'VoiceDictation'])
const homepageFeatures = computed(() =>
  Array.isArray(overview.value?.features)
    ? overview.value.features.filter((f: any) => f.name !== 'StereoMic')
    : []
)
</script>

<template>
  <div class="home-sky" aria-hidden="true">
    <div class="starfield">
      <span v-for="i in 12" :key="i" :class="`star star-${i}`" />
    </div>
  </div>
  <main class="page page-home" data-reveal>
    <section class="hero hero-home moon-hero">
      <div class="hero-copy hero-copy-centered">
        <h1>{{ overview?.brand || 'Nightcord' }}</h1>
        <div class="hero-eyebrow-marquee eyebrow" data-reveal style="transition-delay:80ms">
          <div class="hero-eyebrow-marquee-track">
            <span class="hero-eyebrow-copy">{{ overview?.hero?.eyebrow || 'A Discord client packed with powerful features Discord never gave you.' }}</span>
            <span class="hero-eyebrow-copy" aria-hidden="true">{{ overview?.hero?.eyebrow || 'A Discord client packed with powerful features Discord never gave you.' }}</span>
          </div>
        </div>
        <p class="hero-text hero-home-subtitle">
          {{ overview?.hero?.subtitle || 'Everything Discord doesn\'t build, we create.' }}
        </p>

        <div class="hero-actions hero-actions-centered hero-actions-download" data-reveal style="transition-delay:320ms">
          <div class="download-cta-block">
            <a class="button button-primary button-download-windows" :href="winDownloadUrl" @click="onWindowsDownload">
              <span class="windows-logo" aria-hidden="true"><span/><span/><span/><span/></span>
              <span>Download for Windows</span>
            </a>
            <p class="platform-availability">
              Available on
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.949"/></svg>
              Windows and Linux.
            </p>
          </div>
          <div class="contribute-cta-block">
            <button class="button button-secondary button-contribute-hero" type="button" @click="openContribute">
              <span class="contribute-logo" aria-hidden="true"><span class="contribute-heart"/></span>
              <span>Contribute</span>
            </button>
            <p class="platform-availability">Via Crypto and more.</p>
          </div>
        </div>
        <p class="stats-text" data-reveal style="transition-delay:400ms">
          <span>{{ new Intl.NumberFormat('en-US').format(downloadCount) }}</span> Downloads
        </p>
      </div>
      <div class="hero-app-frame" data-reveal style="transition-delay:480ms">
        <img class="hero-app-screenshot" src="/hero-screenshot.png" alt="Nightcord settings interface" width="1280" height="800">
      </div>
    </section>

    <!-- Metrics (shown when loaded) -->
    <section v-if="overview?.metrics?.length" class="section-copy" data-reveal>
      <div class="metric-grid" id="metric-grid">
        <article v-for="metric in overview.metrics" :key="metric.label" class="metric-card glass-lite">
          <strong>{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
        </article>
      </div>
    </section>

    <section class="section-copy" data-reveal>
      <p class="eyebrow">Plugins</p>
      <h2>The core plugins that make Nightcord feel instantly different.</h2>
    </section>

    <section class="feature-layout feature-layout-home" data-reveal>
      <article class="home-plugin-callout glass-lite">
        <span class="feature-chip">Third-party plugins</span>
        <h3>Explore more plugins.</h3>
        <p>Open the full plugins page to see the extended library.</p>
        <NuxtLink class="button button-secondary" to="/plugins">Explore plugins</NuxtLink>
      </article>
      <div class="feature-column feature-column-home">
        <div class="feature-grid feature-grid-home">
          <article
            v-for="(feature, index) in homepageFeatures"
            :key="feature.name"
            class="feature-card feature-plugin-card glass-lite"
            :data-enabled="featureToggles[feature.name] ?? false"
          >
            <div class="feature-plugin-head">
              <div>
                <span class="feature-chip">{{ feature.category }}</span>
                <h3>{{ feature.name }}</h3>
              </div>
              <button
                class="plugin-switch"
                :class="{ 'is-on': featureToggles[feature.name] }"
                type="button"
                :aria-pressed="featureToggles[feature.name] ?? false"
                :aria-label="`Toggle ${feature.name}`"
                @click="featureToggles[feature.name] = !featureToggles[feature.name]"
              >
                <span />
              </button>
            </div>
            <p>{{ feature.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section-copy home-release-copy" data-reveal>
      <p class="eyebrow">Releases</p>
      <h2>Track the latest Nightcord updates.</h2>
    </section>

    <section class="timeline-panel" data-reveal>
      <article v-for="release in overview?.releases" :key="release.version" class="timeline-item">
        <div>
          <div class="timeline-date">{{ release.released_at }}</div>
          <div class="feature-chip">{{ release.version }}</div>
        </div>
        <div>
          <h3>{{ release.title }}</h3>
          <p>{{ release.summary }}</p>
        </div>
      </article>
    </section>
  </main>

  <!-- Contribute Modal -->
  <Teleport to="body">
    <div v-if="contributeOpen" class="modal-shell" @click.self="closeContribute">
      <div class="modal-backdrop" @click="closeContribute" />
      <section class="contribute-modal glass" role="dialog" aria-modal="true" aria-labelledby="contribute-modal-title">
        <button class="modal-close" type="button" @click="closeContribute">Close</button>
        <div class="contribute-modal-glow" aria-hidden="true" />
        <div class="contribute-modal-head">
          <p class="eyebrow">Support Nightcord</p>
          <h2 id="contribute-modal-title">Copy what you need in one place.</h2>
          <p class="hero-text">Wallet addresses live here with instant copy actions.</p>
        </div>
        <div class="contribute-modal-status" aria-live="polite">{{ contributeStatus }}</div>
        <div class="contribute-modal-grid">
          <article v-for="wallet in [
            { chip: 'Bitcoin', title: 'BTC', desc: 'Use Bitcoin if you want to support development directly.', value: 'bc1qaw2rykpexk69grqgn0ssuyzfh7fgs846sz3tct', label: 'Bitcoin address' },
            { chip: 'Ethereum', title: 'ETH', desc: 'Support releases and ongoing updates with ETH.', value: '0xf03a7117cB6cA2874b7296e386438A073e3227a5', label: 'Ethereum address' },
            { chip: 'Solana', title: 'SOL', desc: 'Support Nightcord with SOL if the project is useful to you.', value: '8QUDWumpDpTiUL7iVKe6WD5CeAfBwtdSeZWUQrNBaKG', label: 'Solana address' },
          ]" :key="wallet.title" class="contribute-copy-card glass-lite">
            <span class="feature-chip">{{ wallet.chip }}</span>
            <h3>{{ wallet.title }}</h3>
            <p>{{ wallet.desc }}</p>
            <div class="contribute-copy-row">
              <code>{{ wallet.value }}</code>
              <button class="button button-secondary" type="button" @click="copyText(wallet.value, wallet.label)">Copy</button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </Teleport>
</template>
