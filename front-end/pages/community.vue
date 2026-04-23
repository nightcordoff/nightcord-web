<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

useHead({
  title: 'Community — Nightcord',
  meta: [{ name: 'description', content: 'Meet the Nightcord team and join the community server.' }]
})

const config = useRuntimeConfig()

type TeamMember = {
  global_name: string
  avatar_url?: string
  avatar_decoration_url?: string
  status?: string
  role?: string
  custom_status?: string
  blurb?: string
  section?: string
  source?: string
  github_url?: string
}

type DiscordData = {
  server_name?: string
  description?: string
  icon_url?: string
  member_count?: number
  online_count?: number
  invite_url?: string
  hierarchy?: Array<{ type: string; name: string }>
  members?: Array<{ username: string; avatar_url?: string }>
}

const teamData = ref<{ title?: string; subtitle?: string; members?: TeamMember[] } | null>(null)
const teamError = ref(false)
const discordData = ref<DiscordData | null>(null)
const discordError = ref(false)
const discordStatus = ref('')

function formatTeamRole(role: string) {
  const n = role.toLowerCase()
  if (n.includes('web dev principal')) return 'Web dev principal'
  if (n.includes('principal developer')) return 'Principal Developer'
  if (n.includes('co-developer')) return 'Co-Developer'
  if (n.includes('developer')) return 'Developer'
  if (n.includes('owner')) return 'Owner'
  if (n.includes('team')) return 'Team'
  return role.trim()
}

function statusLabel(m: TeamMember) {
  if (m.custom_status) return m.custom_status
  if (m.blurb) return m.blurb
  const map: Record<string, string> = { online: 'Online', idle: 'Away', dnd: 'Do Not Disturb', offline: 'Offline' }
  return map[m.status ?? 'offline'] ?? 'Offline'
}

function membersForSection(section: string) {
  return (teamData.value?.members ?? []).filter(m => m.section === section)
}

function formatNumber(val?: number) {
  if (typeof val !== 'number') return '--'
  return new Intl.NumberFormat('en-US').format(val)
}

const { init: initReveal, destroy: destroyReveal } = useScrollReveal()

onMounted(async () => {
  await nextTick()
  initReveal()

  // FIX: Run both API calls in parallel with proper error boundaries
  const apiBase = config.public.apiBase
  const [teamRes, discordRes] = await Promise.allSettled([
    $fetch<any>(`${apiBase}/api/community/team`, { timeout: 8000 }),
    $fetch<DiscordData>(`${apiBase}/api/community/discord`, { timeout: 8000 }),
  ])

  if (teamRes.status === 'fulfilled') {
    teamData.value = teamRes.value
  } else {
    teamError.value = true
  }

  if (discordRes.status === 'fulfilled') {
    discordData.value = discordRes.value
  } else {
    discordError.value = true
    discordStatus.value = 'Discord data unavailable right now.'
  }
})

onUnmounted(() => destroyReveal())
</script>

<template>
  <main class="page" data-reveal>
    <section class="page-hero glass">
      <p class="eyebrow">Get in touch</p>
      <h1>Reach the team, ask questions, and stay close to Nightcord.</h1>
      <p class="hero-text">Community is focused on contact and discussion. Contribution details are on the homepage.</p>
    </section>

    <!-- Team -->
    <section class="team-shell">
      <div class="section-copy compact team-head">
        <p class="eyebrow">Team</p>
        <h3>{{ teamData?.title || 'Meet the Team' }}</h3>
        <p class="hero-text">
          <template v-if="!teamData && !teamError">Loading public Discord profiles…</template>
          <template v-else-if="teamError">Public Discord profiles are unavailable right now.</template>
          <template v-else>{{ teamData?.subtitle || 'The people building Nightcord right now.' }}</template>
        </p>
      </div>

      <template v-for="group in [
        { section: 'Owner', titleClass: 'role-owner', label: 'Owner' },
        { section: 'Team', titleClass: 'role-team', label: 'Team' },
        { section: 'Moderation', titleClass: 'role-mod', label: 'Moderation' },
        { section: 'Helper', titleClass: 'role-helper', label: 'Helper' },
        { section: 'Contributor', titleClass: 'role-contributor', label: 'Contributor' },
      ]" :key="group.section">
        <div class="team-group" v-if="membersForSection(group.section).length > 0 || teamData">
          <h4 class="team-group-title" :class="group.titleClass">{{ group.label }}</h4>
          <div class="team-grid" :class="group.section === 'Owner' ? 'team-grid-owner' : ''">
            <div v-if="membersForSection(group.section).length === 0" class="discord-empty-state">
              No visible profiles in this group yet.
            </div>
            <article
              v-for="member in membersForSection(group.section)"
              :key="member.global_name"
              class="team-card glass-dark"
            >
              <div class="team-avatar-wrap">
                <div class="team-avatar">
                  <img v-if="member.avatar_url" class="team-avatar-image" :src="member.avatar_url" alt="">
                  <span v-else class="team-avatar-fallback">{{ member.global_name.slice(0, 1) }}</span>
                </div>
                <img v-if="member.avatar_decoration_url" class="team-avatar-decoration" :src="member.avatar_decoration_url" alt="">
                <span class="discord-status-dot" :class="`discord-status-${member.status ?? 'offline'}`" />
              </div>
              <a
                v-if="member.source === 'github' && member.github_url"
                class="team-github-badge"
                :href="member.github_url"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub profile"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.165 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>
              <h4>{{ member.global_name }}</h4>
              <div class="team-role">{{ formatTeamRole(member.role ?? '') }}</div>
              <p>{{ statusLabel(member) }}</p>
            </article>
          </div>
        </div>
      </template>
    </section>

    <!-- Discord Live -->
    <section class="discord-live-shell">
      <div class="section-copy compact discord-live-head">
        <p class="eyebrow">Discord Live</p>
        <h3>Live hierarchy pulled from the Discord server when available.</h3>
        <p class="hero-text">This block uses the public Nightcord Discord invite and upgrades itself with widget data whenever Discord exposes the live channel tree.</p>
        <p v-if="discordStatus" :class="{ 'discord-status-error': discordError }">{{ discordStatus }}</p>
      </div>

      <template v-if="discordData">
        <div class="discord-live-grid">
          <!-- Summary card -->
          <article class="discord-live-card glass-dark discord-live-summary">
            <div class="discord-live-server">
              <div class="discord-live-icon">
                <img v-if="discordData.icon_url" :src="discordData.icon_url" alt="">
                <span v-else>{{ (discordData.server_name || 'N').slice(0, 1) }}</span>
              </div>
              <div>
                <span class="feature-chip">Server</span>
                <h3>{{ discordData.server_name || 'Nightcord' }}</h3>
                <p>{{ discordData.description || 'Join the Nightcord Discord server.' }}</p>
              </div>
            </div>
            <div class="discord-live-metrics">
              <div class="discord-live-metric">
                <span>Members</span>
                <strong>{{ formatNumber(discordData.member_count) }}</strong>
              </div>
              <div class="discord-live-metric">
                <span>Online</span>
                <strong>{{ formatNumber(discordData.online_count) }}</strong>
              </div>
            </div>
            <div class="button-row">
              <a v-if="discordData.invite_url" :href="discordData.invite_url" class="button button-secondary" target="_blank" rel="noopener noreferrer">Open Discord server</a>
            </div>
          </article>

          <!-- Hierarchy card -->
          <article class="discord-live-card glass-dark">
            <div class="section-copy compact">
              <p class="eyebrow">Hierarchy</p>
              <h3>Live channels</h3>
            </div>
            <div class="discord-hierarchy-list">
              <template v-if="(discordData.hierarchy ?? []).length">
                <template v-for="(item, i) in discordData.hierarchy" :key="i">
                  <div v-if="item.type === 'category'" class="discord-hierarchy-category">{{ item.name }}</div>
                  <article v-else class="discord-hierarchy-item">
                    <span class="discord-hierarchy-icon">{{ item.type === 'voice' ? '🔊' : '#' }}</span>
                    <span class="discord-hierarchy-name">{{ item.name }}</span>
                  </article>
                </template>
              </template>
              <div v-else class="discord-empty-state">No channels available right now.</div>
            </div>
          </article>

          <!-- Members card -->
          <article class="discord-live-card glass-dark">
            <div class="section-copy compact">
              <p class="eyebrow">Online now</p>
              <h3>Visible Discord members</h3>
            </div>
            <div class="discord-member-list">
              <template v-if="(discordData.members ?? []).length">
                <article v-for="member in discordData.members" :key="member.username" class="discord-member-item">
                  <div class="discord-member-meta">
                    <div class="discord-member-avatar-wrap">
                      <img v-if="member.avatar_url" class="discord-member-avatar" :src="member.avatar_url" alt="">
                      <span v-else class="discord-member-avatar discord-member-avatar-fallback">{{ member.username.slice(0, 1) }}</span>
                    </div>
                    <div class="discord-member-copy">
                      <strong>{{ member.username }}</strong>
                    </div>
                  </div>
                </article>
              </template>
              <div v-else class="discord-empty-state">Widget member presence is not exposed right now.</div>
            </div>
          </article>
        </div>
      </template>
      <div v-else-if="!discordError" class="discord-loading">Loading Discord data…</div>
      <div v-else class="discord-empty-state">Discord data unavailable right now.</div>
    </section>

    <!-- Contact cards -->
    <section class="community-grid">
      <article class="community-card glass">
        <span class="feature-chip">Instagram</span>
        <h3>@ryze_mp</h3>
        <p>Use Instagram for direct contact and follow-up around the project.</p>
      </article>
      <article class="community-card glass">
        <span class="feature-chip">Telegram</span>
        <h3>@ryze_mp</h3>
        <p>Reach out quickly for support, questions, or installation help.</p>
      </article>
      <article class="community-card glass">
        <span class="feature-chip">Discord</span>
        <h3>ahki__</h3>
        <p>Direct Discord contact for project questions and Nightcord help.</p>
      </article>
    </section>
  </main>
</template>
