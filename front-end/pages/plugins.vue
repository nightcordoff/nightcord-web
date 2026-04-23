<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

useHead({
  title: 'Plugins — Nightcord',
  meta: [{ name: 'description', content: 'Browse all Nightcord plugins with search and detailed descriptions.' }]
})

// Inline plugin catalog (converted from plugin-catalog.js)
const plugins = [
  { category: 'Voice', name: 'AntiMoveDeco', description: "Automatically rejoins your voice channel if you are forcefully disconnected or moved." },
  { category: 'Voice', name: 'AutoUnmute', description: "Automatically unmutes and undeafens you if a moderator mutes you, provided you have the required permissions." },
  { category: 'Voice', name: 'CallTimer', description: 'Displays connection duration for each user in a voice channel and your own time in the status bar.' },
  { category: 'Voice', name: 'FakeVoiceOption', description: 'Appears muted or deafened to others while listening and speaking normally.' },
  { category: 'Voice', name: 'RawMic', description: 'Configures a high-quality raw audio pipeline identical to Nightcord with PCM float32 48kHz, OPUS, and high bitrate.' },
  { category: 'Voice', name: 'VoiceChannelSearch', description: 'Adds a search button to find and join any voice channel across all your servers.' },
  { category: 'Voice', name: 'VoiceDictation', description: 'Real-time voice dictation via Whisper with free Groq or OpenAI to fill the message bar.' },
  { category: 'Voice', name: 'VoiceDownload', description: 'Adds a download button directly to voice messages.' },
  { category: 'Voice', name: 'VoiceMessages', description: 'Enables sending voice messages like on mobile via the upload button.' },
  { category: 'Voice', name: 'VoiceRecorder', description: 'Records microphone and PC audio simultaneously via ffmpeg, accessible from the header bar.' },
  { category: 'Video', name: 'VideoRecorder', description: 'Records screen and audio via ffmpeg, accessible from the header bar.' },
  { category: 'Audio', name: 'VolumeBooster', description: 'Allows exceeding the default maximum volume with an adjustable multiplier.' },
  { category: 'Voice', name: 'VoiceRejoin', description: 'Automatically rejoins the last voice call or server upon Discord restart.' },
  { category: 'Audio', name: 'SoundCloudPlayer', description: 'Integrated SoundCloud player with search, favorites, playback controls, and audio output selection.' },
  { category: 'Identity', name: 'CustomProfile', description: 'Visually customizes your Discord profile with nickname, avatar, banner, badges, and bio, visible only to you.' },
  { category: 'Identity', name: 'PlatformSpoofer', description: 'Makes Discord believe you are on another platform visible in your status.' },
  { category: 'Account', name: 'TokenImporter', description: 'Imports and verifies Discord tokens to log into accounts.' },
  { category: 'Account', name: 'LoginWithToken', description: 'Adds a "Login with Token" button directly on the Discord login page.' },
  { category: 'Account', name: 'UnlimitedAccounts', description: 'Increases the limit of Discord accounts addable in the account switcher.' },
  { category: 'Account', name: 'MultiInstance', description: 'Opens a second Discord instance in a new window or split-screen with another account.' },
  { category: 'Social', name: 'FakeFriends', description: 'Locally simulates friends and Discord requests, reset upon reload.' },
  { category: 'Messaging', name: 'AutoReply', description: 'Automatically responds to received DM messages with a button in the text bar.' },
  { category: 'Messaging', name: 'AutoCorrect', description: 'Automatically corrects spelling and grammar before sending via Groq.' },
  { category: 'Messaging', name: 'AutoResponder', description: 'Automatically replies to messages using a customized AI.' },
  { category: 'Messaging', name: 'FakeDM', description: 'Injects local fake messages into a DM, visible only to you.' },
  { category: 'Messaging', name: 'FloodPanel', description: 'Sends bulk messages in a channel with configurable delay and custom list.' },
  { category: 'Messaging', name: 'MessageCleaner', description: 'Bulk deletes messages in a channel.' },
  { category: 'Messaging', name: 'MessageLogger', description: 'Temporarily preserves deleted and modified messages to display them in Discord.' },
  { category: 'Messaging', name: 'MessageLoggerEnhanced', description: 'Enhanced version with modification history, ghost ping detection, image saving, and more.' },
  { category: 'Messaging', name: 'Impersonate', description: 'Locally simulates a message sent by any user via /impersonate.' },
  { category: 'Messaging', name: 'ExportDM', description: 'Exports your DMs to TXT or JSON with messages, media, links, stickers, and reactions.' },
  { category: 'Messaging', name: 'Translate', description: 'Translates messages directly in Discord via Google Translate or DeepL.' },
  { category: 'Files', name: 'BigFileUpload', description: 'Bypasses Discord upload limits via GoFile, Catbox, or a custom uploader.' },
  { category: 'Files', name: 'AnonymiseFileNames', description: 'Anonymizes filenames before sending with random, fixed, or timestamped names.' },
  { category: 'Files', name: 'AutoZipper', description: 'Automatically compresses heavy files and folders into .zip before sending.' },
  { category: 'Social', name: 'MassDM', description: 'Sends an identical message to all your friends with anti-rate-limit delay.' },
  { category: 'Messaging', name: 'FindReply', description: 'Jumps to the first reply of a message to easily follow past conversations.' },
  { category: 'Social', name: 'BulkFriendRemove', description: 'Removes multiple friends at once via a selection interface with search bar.' },
  { category: 'Social', name: 'CancelFriendRequest', description: 'Cancels a pending friend request by re-clicking the button.' },
  { category: 'Voice', name: 'FollowUser', description: 'Automatically follows a person through voice channels via right-click.' },
  { category: 'Utility', name: 'BetterBlockedUsers', description: 'Adds a search bar to the blocked users list and allows viewing their profiles.' },
  { category: 'Utility', name: 'AlwaysTrust', description: 'Removes untrusted domain and suspicious download popups, and certain heavy confirmations.' },
  { category: 'Visual', name: 'MacOsButtons', description: 'Replaces Windows window buttons with macOS red, yellow, and green style.' },
  { category: 'Utility', name: 'TitlebarLink', description: 'Click the central Discord title to open nightcord.online.' },
  { category: 'Utility', name: 'StealthMode', description: 'Ctrl+Shift+H shortcut to hide certain UI elements.' },
  { category: 'Visual', name: 'ViewIcons', description: 'Makes avatars and banners clickable in profiles with "View Icon" or "Banner" options.' },
  { category: 'Visual', name: 'PinDMs', description: 'Allows pinning DMs at the top of the conversation list.' },
  { category: 'Voice', name: 'UserVoiceShow', description: 'Displays a user\'s current voice channel directly in their profile.' },
  { category: 'Utility', name: 'ReverseImageSearch', description: 'Adds a reverse image search option in the image context menu.' },
  { category: 'Utility', name: 'PermissionsViewer', description: 'Allows viewing permissions of a role or user on a server.' },
  { category: 'Visual', name: 'ThemeLibrary', description: 'Adds a Discord theme library directly accessible from settings.' },
  { category: 'Moderation', name: 'FakePerm', description: 'Displays a fake moderator interface on servers, visible only to you.' },
  { category: 'Utility', name: 'AntiGroup', description: 'Automatically leaves DM groups as soon as you are added, with a configurable auto-message.' },
  { category: 'Messaging', name: 'NoUnblockToJump', description: 'Allows jumping to messages from blocked users without having to unblock them.' },
  { category: 'Utility', name: 'CrashHandler', description: 'Detects Discord crashes and attempts to recover automatically without restarting.' },
  { category: 'Security', name: 'BetterSessions', description: 'Improves the Sessions tab with precise timestamps, device renaming, and new connection alerts.' },
  { category: 'Account', name: 'GhostClient', description: 'Ghost Discord account management with left-click to activate and right-click to configure.' },
  { category: 'Utility', name: 'NightcordUpdater', description: 'Checks for Nightcord updates and displays a banner when a new version is available.' },
  { category: 'Identity', name: 'ValidUser', description: 'Detects and displays the Active Developer badge.' },
  { category: 'Audio', name: 'SpotifyCrack', description: 'Disables automatic Spotify pausing when Discord detects activity.' },
  { category: 'AI', name: 'NightcordAI', description: 'Integrated AI provider via Groq for auto-correction and voice dictation.' },
  { category: 'Identity', name: 'Abreviation', description: 'Allows using custom abbreviations in chat.' },
  { category: 'Identity', name: 'ActivitySpoofer', description: 'Customizes your Discord activity (game, music, etc.).' },
  { category: 'Moderation', name: 'AntiMoveDeco2', description: 'Prevents being moved or disconnected from voice channels.' },
  { category: 'Audio', name: 'AudioLimiter', description: 'Limits sound volume to protect your ears.' },
  { category: 'Messaging', name: 'AutoTranslateNightcord', description: 'Automatically translates incoming and outgoing messages.' },
  { category: 'Visual', name: 'Backpack', description: 'An inventory for your favorite emojis and stickers.' },
  { category: 'Visual', name: 'ChannelWallpaper', description: 'Sets a custom wallpaper for each channel.' },
  { category: 'Visual', name: 'CursorMacOS', description: 'Uses the macOS cursor on Discord.' },
  { category: 'Audio', name: 'CustomSounds', description: 'Customizes Discord notification sounds.' },
  { category: 'Voice', name: 'DisableCallIdle', description: 'Prevents being disconnected from a call for inactivity.' },
  { category: 'Voice', name: 'DoubleCall', description: 'Allows being in two voice calls at the same time.' },
  { category: 'Security', name: 'DoubleClickAntiLog', description: 'Prevents accidental logs during a double click.' },
  { category: 'Messaging', name: 'DoubleEmoji', description: 'Sends the same emoji twice quickly.' },
  { category: 'Security', name: 'EncryptedMessage', description: 'Sends end-to-end encrypted messages.' },
  { category: 'Utility', name: 'EventLogs', description: 'Full log of Discord events (joins, leaves, etc.).' },
  { category: 'Visual', name: 'LiveWallpaper', description: 'Animated wallpapers for your Discord interface.' },
  { category: 'Utility', name: 'LockGroup', description: 'Locks a group to prevent new members.' },
  { category: 'Utility', name: 'LunaHook', description: 'Advanced integration with webhooks.' },
  { category: 'Audio', name: 'MuteAllServers', description: 'Mutes all servers at once.' },
  { category: 'Utility', name: 'PlatformIndicators', description: 'Displays the platform (mobile, pc) of users.' },
  { category: 'Utility', name: 'RoleColorEverywhere', description: 'Displays role color everywhere in the interface.' },
  { category: 'Messaging', name: 'SelfDestruct', description: 'Messages that self-destruct after reading.' },
  { category: 'Utility', name: 'ServerCloner', description: 'Copies the structure of a Discord server.' },
  { category: 'Moderation', name: 'SharePerms', description: 'Share your moderation permissions with trusted friends.' },
  { category: 'Visual', name: 'ShowHiddenChannels', description: 'Displays hidden channels of servers.' },
  { category: 'Visual', name: 'ShowHiddenThings', description: 'Reveals various hidden interface elements.' },
  { category: 'Visual', name: 'Translucence', description: 'Makes the Discord interface translucent.' },
  { category: 'Visual', name: 'UnlockEmoji', description: 'Use emojis everywhere without Nitro (locally).' },
  { category: 'Visual', name: 'UserAreaTweaks', description: 'Customizes the user area at the bottom left.' },
  { category: 'Voice', name: 'VBAudioVirtuel', description: 'Integration with VB-Audio for advanced audio routing.' },
  { category: 'Voice', name: 'WhosWatching', description: 'Displays who is watching your stream in real-time.' },
  { category: 'Messaging', name: 'DMBomb', description: 'Sends bursts of messages in DM.' },
  { category: 'Utility', name: 'CreateTheme', description: 'Tool to easily create your own themes.' },
  { category: 'Utility', name: 'EquicordHelper', description: 'Assistant for Equicord features.' },
  { category: 'Utility', name: 'EquicordToolbox', description: 'Advanced toolbox for Equicord.' },
  { category: 'Audio', name: 'SoundCloudPlayer2', description: 'Integrated SoundCloud player.' },
  { category: 'Voice', name: 'VoiceChatUtilities', description: 'Various utilities for voice channels.' },
]

const VIDEO_BASE = 'https://raw.githubusercontent.com/nightcordoff/nightcord-tutorials/main/videos/'
const VIDEO_CACHE_KEY = 'nc_video_status_v2'

const query = ref('')
const videoStatusMap = ref<Record<string, boolean> | null>(null)
const selectedPlugin = ref<typeof plugins[0] | null>(null)
const modalVideoSrc = ref('')
const modalVideoError = ref(false)

const filteredPlugins = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return plugins
  return plugins.filter(p =>
    [p.category, p.name, p.description].join(' ').toLowerCase().includes(q)
  )
})

function hasVideo(name: string) {
  if (!videoStatusMap.value) return null // unknown yet
  return videoStatusMap.value[name] ?? false
}

function openModal(plugin: typeof plugins[0]) {
  selectedPlugin.value = plugin
  modalVideoError.value = false
  const known = hasVideo(plugin.name)
  if (known !== false) {
    modalVideoSrc.value = `${VIDEO_BASE}${encodeURIComponent(plugin.name)}.mp4`
  } else {
    modalVideoSrc.value = ''
  }
}

function closeModal() {
  selectedPlugin.value = null
  modalVideoSrc.value = ''
}

// FIX: Video checks are done AFTER the page renders, in small batches to prevent freezing
// Instead of 140+ simultaneous HEAD requests, we process them in batches of 10
async function checkVideosBatched() {
  if (!import.meta.client) return

  // Check session storage cache first
  try {
    const raw = sessionStorage.getItem(VIDEO_CACHE_KEY)
    if (raw) {
      videoStatusMap.value = JSON.parse(raw)
      return
    }
  } catch {}

  const BATCH_SIZE = 10
  const map: Record<string, boolean> = {}

  for (let i = 0; i < plugins.length; i += BATCH_SIZE) {
    const batch = plugins.slice(i, i + BATCH_SIZE)
    // Use AbortController with timeout for each request
    const results = await Promise.allSettled(
      batch.map(async (plugin) => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 4000)
        try {
          const res = await fetch(
            `${VIDEO_BASE}${encodeURIComponent(plugin.name)}.mp4`,
            { method: 'HEAD', signal: controller.signal }
          )
          return { name: plugin.name, hasVideo: res.ok }
        } catch {
          return { name: plugin.name, hasVideo: false }
        } finally {
          clearTimeout(timeout)
        }
      })
    )
    results.forEach(r => {
      if (r.status === 'fulfilled') map[r.value.name] = r.value.hasVideo
    })
    // Update reactively so badges appear progressively
    videoStatusMap.value = { ...map }
    // Small yield between batches to not block the main thread
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  try { sessionStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(map)) } catch {}
}

const { init: initReveal, destroy: destroyReveal } = useScrollReveal()

onMounted(async () => {
  await nextTick()
  initReveal()
  // Start video checks asynchronously AFTER the page has rendered
  checkVideosBatched()
})

onUnmounted(() => destroyReveal())

// Keyboard close modal
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal()
}
</script>

<template>
  <main class="page page-plugins" data-reveal>
    <section class="page-hero glass">
      <p class="eyebrow">Plugins</p>
      <h1>Every plugin you actually need.</h1>
      <p class="hero-text">Voice control, message tooling, fake presence, token login, automation, file handling, profile tricks, and moderation-style utilities all live here in one real catalog.</p>
    </section>

    <section class="plugin-toolbar glass-lite">
      <label class="plugin-search" for="plugin-search-input">
        <span class="console-label">Search plugins</span>
        <input
          id="plugin-search-input"
          v-model="query"
          type="search"
          placeholder="Search by plugin, category, or feature"
          autocomplete="off"
        >
      </label>
    </section>

    <section class="plugin-grid" id="plugin-grid">
        <article
          v-for="(plugin, index) in filteredPlugins"
          :key="plugin.name"
          class="plugin-card glass plugin-card-clickable"
          :style="`--i:${index}`"
          role="button"
          tabindex="0"
          @click="openModal(plugin)"
          @keydown.enter="openModal(plugin)"
        >
          <!-- Video badge: shown only after check completes -->
          <span
            v-if="hasVideo(plugin.name) === true"
            class="plugin-video-badge"
            data-has-video="true"
            title="Vidéo disponible"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>
            </svg>
          </span>
          <div class="plugin-card-top">
            <span class="plugin-card-icon-wrap" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 2v6"/><path d="M15 2v6"/><path d="M12 17v5"/>
                <path d="M5 8h14"/><path d="M6 11v1a6 6 0 0 0 12 0v-1"/>
              </svg>
            </span>
            <span class="feature-chip">{{ plugin.category }}</span>
          </div>
          <h3>{{ plugin.name }}</h3>
          <p>{{ plugin.description }}</p>
        </article>

        <article v-if="filteredPlugins.length === 0" class="plugin-card plugin-card-empty glass">
          <span class="feature-chip">No match</span>
          <h3>No plugin found.</h3>
          <p>Try another keyword such as voice, audio, token, theme, or ghost.</p>
        </article>
    </section>
  </main>

  <!-- Plugin detail modal -->
  <Teleport to="body">
    <div
      v-if="selectedPlugin"
      class="modal-shell"
      role="dialog"
      aria-modal="true"
      @keydown="onKeyDown"
    >
      <div class="modal-backdrop" @click="closeModal" />
      <section class="plugin-detail-modal glass">
        <button class="modal-close" type="button" @click="closeModal">Close</button>
        <div class="plugin-detail-head">
          <span class="feature-chip">{{ selectedPlugin.category }}</span>
          <h2>{{ selectedPlugin.name }}</h2>
        </div>
        <p class="plugin-detail-description">{{ selectedPlugin.description }}</p>

        <!-- Video: only loaded on modal open, not before -->
        <div v-if="modalVideoSrc && !modalVideoError" class="plugin-detail-video-wrap">
          <video
            class="plugin-detail-video"
            :src="modalVideoSrc"
            autoplay
            loop
            muted
            playsinline
            @error="modalVideoError = true"
          />
        </div>
        <p v-else-if="hasVideo(selectedPlugin.name) === false" class="plugin-detail-no-video">
          No tutorial video available for this plugin.
        </p>
      </section>
    </div>
  </Teleport>
</template>
