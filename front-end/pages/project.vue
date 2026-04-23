<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

useHead({
  title: 'Projects — Nightcord',
  meta: [{ name: 'description', content: 'All active Nightcord projects.' }]
})

const config = useRuntimeConfig()

const query = ref('')
const ncDownloads = ref('—')
const nlDownloads = ref('351')
const scDownloads = ref('113')

const projects = [
  {
    id: 'nightcord',
    href: '/',
    avatar: '/image.png',
    org: 'nightcordoff /',
    name: 'Nightcord',
    desc: 'A Discord client packed with powerful features Discord never gave you. Plugins, themes, tweaks — all built-in.',
    lang: { color: '#3178c6', label: 'TypeScript' },
    countRef: 'nc',
  },
  {
    id: 'louder',
    href: 'https://github.com/nightcordoff/nightcord_louder/releases/',
    avatar: '/louderlogo.png',
    org: 'nightcordoff /',
    name: 'Nightcord Louder',
    desc: 'A cord that offers you an unprecedented audio experience, innovative and premium options.',
    lang: { color: '#490000', label: 'C++' },
    countRef: 'nl',
  },
  {
    id: 'soundcord',
    href: 'https://nightcord.online/soundcord',
    avatar: '/soundcord-logo.png',
    org: 'nightcordoff /',
    name: 'Soundcord',
    desc: "Stream every track you love — no ads, no limits, no skips. SoundCloud's full catalog directly inside Discord.",
    lang: { color: '#f1e05a', label: 'JavaScript' },
    countRef: 'sc',
  },
]

const filteredProjects = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return projects
  return projects.filter(p =>
    [p.name, p.desc, p.lang.label].join(' ').toLowerCase().includes(q)
  )
})

const { init: initReveal, destroy: destroyReveal } = useScrollReveal()

onMounted(async () => {
  const firebaseUrl = config.public.firebaseUrl
  // Load download count non-blocking
  fetch(`${firebaseUrl}/downloads/count.json`)
    .then(r => r.json())
    .then((val: number) => {
      ncDownloads.value = new Intl.NumberFormat('en-US').format(Number(val) || 0)
    })
    .catch(() => {})

  // Wait for v-for cards to be in the DOM before observing
  await nextTick()
  initReveal()
})

onUnmounted(() => destroyReveal())

function getCount(ref: string) {
  if (ref === 'nc') return ncDownloads.value
  if (ref === 'nl') return nlDownloads.value
  return scDownloads.value
}
</script>

<template>
  <main class="page page-project" data-reveal>
    <section class="proj-hub">
      <div class="proj-hub-header">
        <p class="eyebrow">Projects</p>
        <h1 class="proj-hub-title">Projects</h1>
        <p class="proj-hub-count">{{ filteredProjects.length }} active project{{ filteredProjects.length !== 1 ? 's' : '' }}</p>
      </div>

      <div class="proj-search-wrap">
        <svg class="proj-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input v-model="query" class="proj-search" type="search" placeholder="Search projects…" autocomplete="off" spellcheck="false">
      </div>

      <div class="proj-grid">
        <a
          v-for="proj in filteredProjects"
          :key="proj.id"
          class="proj-card glass"
          :href="proj.href"
          data-reveal
        >
          <div class="proj-card-top">
            <img class="proj-card-avatar" :src="proj.avatar" :alt="proj.name" width="40" height="40">
            <div class="proj-card-names">
              <span class="proj-card-org">{{ proj.org }}</span>
              <span class="proj-card-name">{{ proj.name }}</span>
            </div>
          </div>
          <p class="proj-card-desc">{{ proj.desc }}</p>
          <div class="proj-card-footer">
            <span class="proj-card-stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {{ getCount(proj.countRef) }}
            </span>
            <span class="proj-card-lang">
              <span class="proj-lang-dot" :style="`background:${proj.lang.color}`" />
              {{ proj.lang.label }}
            </span>
          </div>
        </a>
      </div>
    </section>
  </main>
</template>
