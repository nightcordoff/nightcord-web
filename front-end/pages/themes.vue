<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

useHead({
  title: 'Themes — Nightcord',
  meta: [{ name: 'description', content: 'Browse and download Discord themes and CSS snippets for Nightcord.' }]
})

const config = useRuntimeConfig()

type Theme = {
  id: string | number
  name: string
  description?: string
  type?: string
  tags?: string[]
  author?: { discord_name?: string; github_name?: string; discord_snowflake?: string }
  thumbnail_url?: string
  likes?: number
  downloads?: number
  release_date?: string
  content?: string
  source?: string
}

const allThemes = ref<Theme[]>([])
const loading = ref(true)
const error = ref('')
const query = ref('')
const activeType = ref('all')
const selectedTheme = ref<Theme | null>(null)
const copiedCode = ref(false)
const cssurlCopied = ref(false)

// FIX: Use useLazyFetch so the page renders immediately without blocking
const { data: themesData, error: fetchError } = await useLazyFetch<Theme[]>(
  `${config.public.apiBase}/api/themes`,
  { timeout: 8000 }
)

watch(themesData, (val) => {
  if (Array.isArray(val)) {
    allThemes.value = val
    loading.value = false
  }
})
watch(fetchError, (err) => {
  if (err) {
    loading.value = false
    error.value = 'Failed to load themes. Try again later.'
  }
})

const filteredThemes = computed(() => {
  const q = query.value.trim().toLowerCase()
  return allThemes.value
    .filter(t => {
      if (activeType.value !== 'all' && t.type !== activeType.value) return false
      if (!q) return true
      return [t.name, t.description, t.author?.discord_name, t.author?.github_name, ...(t.tags ?? [])]
        .join(' ').toLowerCase().includes(q)
    })
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
})

function formatDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }) }
  catch { return '—' }
}

function decodeCss(theme: Theme) {
  if (!theme.content) return ''
  try { return atob(theme.content) } catch { return '' }
}

function parseCssVersion(css: string) {
  const m = css.match(/@version\s+([^\s*/]+)/)
  return m ? m[1] : '—'
}

function getCssImportUrl(css: string, theme: Theme) {
  const m = css.match(/@import\s+url\(['"]?([^'"\)]+)['"]?\)/i)
  return m ? m[1] : (theme.source ?? '')
}

function openModal(theme: Theme) {
  selectedTheme.value = theme
  copiedCode.value = false
  cssurlCopied.value = false
}
function closeModal() { selectedTheme.value = null }

async function downloadTheme(theme: Theme) {
  const css = decodeCss(theme)
  if (!css) return
  const blob = new Blob([css], { type: 'text/css' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(theme.name ?? 'theme').replace(/[^a-z0-9_-]/gi, '_')}.theme.css`
  a.click()
  URL.revokeObjectURL(url)
}

async function copyCode(css: string) {
  await navigator.clipboard.writeText(css).catch(() => {})
  copiedCode.value = true
  setTimeout(() => { copiedCode.value = false }, 1800)
}

const { init: initReveal, destroy: destroyReveal } = useScrollReveal()
onMounted(async () => { await nextTick(); initReveal() })
onUnmounted(() => destroyReveal())
</script>

<template>
  <main class="page page-themes">
    <section class="themes-hub">
      <div class="themes-hub-header">
        <p class="eyebrow">Themes</p>
        <h1 class="themes-hub-title">Themes &amp; Snippets</h1>
        <p class="themes-hub-sub">Browse and download Discord themes for Nightcord. Powered by the Equicord theme library.</p>
      </div>

      <div class="themes-controls">
        <div class="themes-search-wrap">
          <svg class="themes-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input v-model="query" class="themes-search" type="search" placeholder="Search themes…" autocomplete="off" spellcheck="false">
        </div>
        <div class="themes-tabs" role="tablist">
          <button
            v-for="tab in [{ id: 'all', label: 'All' }, { id: 'theme', label: 'Themes' }, { id: 'snippet', label: 'Snippets' }]"
            :key="tab.id"
            class="themes-tab"
            :class="{ 'themes-tab-active': activeType === tab.id }"
            role="tab"
            @click="activeType = tab.id"
          >{{ tab.label }}</button>
        </div>
      </div>

      <p class="themes-count">
        <template v-if="loading">Loading…</template>
        <template v-else-if="error">{{ error }}</template>
        <template v-else>{{ filteredThemes.length }} result{{ filteredThemes.length !== 1 ? 's' : '' }}</template>
      </p>

      <div class="themes-grid">
        <!-- Loading state -->
        <div v-if="loading" class="themes-loading">
          <div class="themes-spinner" />
          <span>Fetching themes…</span>
        </div>

        <!-- Error state -->
        <p v-else-if="error" style="color: rgba(255,255,255,0.4)">{{ error }}</p>

        <!-- Empty state -->
        <p v-else-if="filteredThemes.length === 0" class="themes-empty">No themes found.</p>

        <!-- Theme cards -->
        <div
          v-else
          v-for="theme in filteredThemes"
          :key="theme.id"
          class="theme-card glass"
          role="button"
          tabindex="0"
          @click="openModal(theme)"
          @keydown.enter="openModal(theme)"
        >
          <div class="theme-card-thumb">
            <img
              v-if="theme.thumbnail_url"
              :src="theme.thumbnail_url"
              :alt="theme.name"
              loading="lazy"
              decoding="async"
            >
            <div v-else class="theme-card-thumb-placeholder" />
            <span class="theme-card-type" :class="theme.type === 'snippet' ? 'theme-card-type-snippet' : 'theme-card-type-theme'">
              {{ theme.type === 'snippet' ? 'Snippet' : 'Theme' }}
            </span>
          </div>
          <div class="theme-card-body">
            <div class="theme-card-tags">
              <span v-for="tag in (theme.tags ?? []).slice(0, 3)" :key="tag" class="theme-card-tag">{{ tag }}</span>
            </div>
            <strong class="theme-card-name">{{ theme.name }}</strong>
            <p class="theme-card-desc">{{ theme.description ?? '' }}</p>
          </div>
          <div class="theme-card-footer">
            <span class="theme-card-stat">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {{ theme.likes ?? 0 }}
            </span>
            <span class="theme-card-author">by {{ theme.author?.discord_name ?? theme.author?.github_name ?? 'Unknown' }}</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Theme detail modal -->
  <Teleport to="body">
    <div
      v-if="selectedTheme"
      class="theme-modal-overlay"
      role="dialog"
      aria-modal="true"
      @keydown.esc="closeModal"
    >
      <div class="theme-modal glass">
        <button class="theme-modal-close" @click="closeModal" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div class="theme-modal-layout">
          <div class="theme-modal-left">
            <div class="theme-modal-left-header">
              <span class="theme-card-type" :class="selectedTheme.type === 'snippet' ? 'theme-card-type-snippet' : 'theme-card-type-theme'">
                {{ selectedTheme.type === 'snippet' ? 'Snippet' : 'Theme' }}
              </span>
              <h2 class="theme-modal-name">{{ selectedTheme.name }}</h2>
              <p class="theme-modal-desc">{{ selectedTheme.description ?? '' }}</p>
              <div class="theme-modal-tags">
                <span v-for="tag in (selectedTheme.tags ?? [])" :key="tag" class="theme-card-tag">{{ tag }}</span>
              </div>
            </div>
            <div class="theme-modal-preview-wrap">
              <img
                v-if="selectedTheme.thumbnail_url"
                class="theme-modal-preview-img"
                :src="selectedTheme.thumbnail_url"
                :alt="selectedTheme.name ?? ''"
                loading="lazy"
              >
              <div v-else class="theme-modal-preview-placeholder" />
            </div>
            <div v-if="decodeCss(selectedTheme)" class="theme-modal-code-section">
              <div class="theme-modal-code-header">
                <span>Source Code</span>
                <button class="theme-modal-copy-code-btn" @click="copyCode(decodeCss(selectedTheme))">
                  {{ copiedCode ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre class="theme-modal-code"><code>{{ decodeCss(selectedTheme) }}</code></pre>
            </div>
          </div>

          <div class="theme-modal-right">
            <div class="theme-modal-stats">
              <div class="theme-modal-stat">
                <span class="theme-modal-stat-label">Downloads</span>
                <span class="theme-modal-stat-value">{{ selectedTheme.downloads != null ? new Intl.NumberFormat('fr-FR').format(selectedTheme.downloads) : '—' }}</span>
              </div>
              <div class="theme-modal-stat">
                <span class="theme-modal-stat-label">Likes</span>
                <span class="theme-modal-stat-value">{{ selectedTheme.likes ?? '—' }}</span>
              </div>
              <div class="theme-modal-stat">
                <span class="theme-modal-stat-label">Released</span>
                <span class="theme-modal-stat-value">{{ formatDate(selectedTheme.release_date) }}</span>
              </div>
              <div class="theme-modal-stat">
                <span class="theme-modal-stat-label">Version</span>
                <span class="theme-modal-stat-value">{{ decodeCss(selectedTheme) ? parseCssVersion(decodeCss(selectedTheme)) : '—' }}</span>
              </div>
            </div>

            <div v-if="getCssImportUrl(decodeCss(selectedTheme), selectedTheme)" class="theme-modal-cssurl-section">
              <span class="theme-modal-stat-label">CSS URL</span>
              <code class="theme-modal-cssurl">{{ getCssImportUrl(decodeCss(selectedTheme), selectedTheme) }}</code>
            </div>

            <div class="theme-modal-actions">
              <a v-if="selectedTheme.source" :href="selectedTheme.source" target="_blank" rel="noopener noreferrer" class="button button-secondary">
                GitHub
              </a>
              <button
                v-if="decodeCss(selectedTheme)"
                class="button button-primary"
                @click="downloadTheme(selectedTheme)"
              >
                Download .css
              </button>
            </div>

            <div v-if="selectedTheme.author?.discord_name || selectedTheme.author?.github_name" class="theme-modal-contrib">
              <span class="theme-modal-stat-label">Author</span>
              <strong>{{ selectedTheme.author?.discord_name ?? selectedTheme.author?.github_name }}</strong>
              <span v-if="selectedTheme.author?.discord_snowflake" class="theme-modal-contrib-id">
                ID: {{ selectedTheme.author.discord_snowflake }}
              </span>
              <div class="theme-modal-contrib-links">
                <a
                  v-if="selectedTheme.author?.discord_snowflake"
                  :href="`https://discord.com/users/${selectedTheme.author.discord_snowflake}`"
                  target="_blank" rel="noopener noreferrer"
                  class="button button-secondary"
                >Discord</a>
                <a
                  v-if="selectedTheme.author?.github_name"
                  :href="`https://github.com/${selectedTheme.author.github_name}`"
                  target="_blank" rel="noopener noreferrer"
                  class="button button-secondary"
                >GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
