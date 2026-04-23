<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({
  title: 'Admin — Nightcord',
  meta: [{ robots: 'noindex, nofollow' }]
})

const config = useRuntimeConfig()

type User = {
  id: number
  email: string
  display_name: string
  admin_title?: string
  role: string
  can_manage_admins: boolean
  active: boolean
}

const session = ref<{ token: string; user: any | null }>({ token: '', user: null })
const loginEmail = ref('')
const loginPassword = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const authStatus = ref('Not authenticated.')
const authError = ref(false)
const adminStatus = ref('')
const adminError = ref(false)
const users = ref<User[]>([])
const seededCreds = ref<any>(null)

// Create user form
const createEmail = ref('')
const createDisplayName = ref('')
const createAdminTitle = ref('')
const createPassword = ref('')
const createRole = ref('admin')
const createManageAdmins = ref(false)

function apiUrl(path: string) {
  return `${config.public.apiBase}${path}`
}

async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    headers: {
      ...(session.value.token ? { Authorization: `Bearer ${session.value.token}` } : {}),
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...((options as any)?.headers || {}),
    },
    ...options,
  })
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`
    try { const p = await res.json(); msg = p.error || msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}

function setSession(token: string, user: any) {
  session.value = { token, user }
  if (import.meta.client) {
    if (token) localStorage.setItem('nightcord.session.token', token)
    else localStorage.removeItem('nightcord.session.token')
  }
  if (user) {
    authStatus.value = `Logged in as ${user.display_name} (${user.role})`
    authError.value = false
  } else {
    authStatus.value = 'Not authenticated.'
    users.value = []
  }
}

async function loadUsers() {
  if (!session.value.user?.can_manage_admins) { users.value = []; return }
  try {
    const payload = await apiFetch('/api/admin/users')
    users.value = payload.users
    adminStatus.value = `Loaded ${payload.users.length} account(s).`
    adminError.value = false
  } catch (e: any) {
    adminStatus.value = e.message
    adminError.value = true
  }
}

async function refreshSession() {
  if (!session.value.token) return
  try {
    const payload = await apiFetch('/api/auth/me')
    setSession(session.value.token, payload.user)
    await loadUsers()
  } catch {
    setSession('', null)
  }
}

async function login() {
  try {
    const payload = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail.value, password: loginPassword.value }),
    })
    setSession(payload.token, payload.user)
    loginPassword.value = ''
    await loadUsers()
  } catch (e: any) {
    authStatus.value = e.message
    authError.value = true
  }
}

async function logout() {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }) } catch {}
  setSession('', null)
  adminStatus.value = 'Logged out.'
}

async function changePassword() {
  try {
    await apiFetch('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword.value, new_password: newPassword.value }),
    })
    adminStatus.value = 'Password changed.'
    adminError.value = false
    currentPassword.value = ''
    newPassword.value = ''
  } catch (e: any) {
    adminStatus.value = e.message
    adminError.value = true
  }
}

async function createUser() {
  try {
    await apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: createEmail.value,
        display_name: createDisplayName.value,
        admin_title: createAdminTitle.value,
        password: createPassword.value,
        role: createRole.value,
        can_manage_admins: createManageAdmins.value,
      }),
    })
    adminStatus.value = `User ${createEmail.value} created.`
    adminError.value = false
    createEmail.value = ''; createDisplayName.value = ''; createAdminTitle.value = ''
    createPassword.value = ''; createRole.value = 'admin'; createManageAdmins.value = false
    await loadUsers()
  } catch (e: any) {
    adminStatus.value = e.message
    adminError.value = true
  }
}

async function saveUser(user: User) {
  try {
    await apiFetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        display_name: user.display_name,
        admin_title: user.admin_title,
        role: user.role,
        can_manage_admins: user.can_manage_admins,
        active: user.active,
      }),
    })
    adminStatus.value = `User ${user.display_name} saved.`
    adminError.value = false
  } catch (e: any) {
    adminStatus.value = e.message
    adminError.value = true
  }
}

onMounted(async () => {
  if (import.meta.client) {
    session.value.token = localStorage.getItem('nightcord.session.token') || ''
  }
  // Load overview and session in parallel
  const [health, _] = await Promise.allSettled([
    apiFetch('/api/health'),
    refreshSession(),
  ])
  try {
    // Load seeded creds from overview
    const overview = await apiFetch('/api/overview')
    if (overview?.auth) seededCreds.value = overview.auth
  } catch {}
})
</script>

<template>
  <main class="page page-admin">
    <section class="admin-shell">
      <div class="admin-header">
        <p class="eyebrow">Admin</p>
        <h1>Nightcord Admin Console</h1>
        <p class="admin-auth-status" :class="{ 'is-error': authError }">{{ authStatus }}</p>
        <p v-if="adminStatus" class="admin-status" :class="{ 'is-error': adminError }">{{ adminStatus }}</p>
      </div>

      <!-- Seeded creds -->
      <div v-if="seededCreds" class="admin-seeded-creds glass-lite">
        <strong>Seeded superadmin</strong>
        <div>{{ seededCreds.default_superadmin?.email }}</div>
        <div>{{ seededCreds.default_superadmin?.password }}</div>
        <div>{{ seededCreds.admin_count }} active admin account(s).</div>
      </div>

      <!-- Login form -->
      <form v-if="!session.user" class="admin-form glass-lite" @submit.prevent="login">
        <h3>Login</h3>
        <label>
          <span>Email</span>
          <input v-model="loginEmail" type="email" required autocomplete="email">
        </label>
        <label>
          <span>Password</span>
          <input v-model="loginPassword" type="password" required autocomplete="current-password">
        </label>
        <button class="button button-primary" type="submit">Login</button>
      </form>

      <!-- Logged-in controls -->
      <template v-if="session.user">
        <div class="admin-session-actions">
          <button class="button button-secondary" type="button" @click="logout">Logout</button>
        </div>

        <!-- Change password -->
        <form class="admin-form glass-lite" @submit.prevent="changePassword">
          <h3>Change Password</h3>
          <label>
            <span>Current password</span>
            <input v-model="currentPassword" type="password" required autocomplete="current-password">
          </label>
          <label>
            <span>New password</span>
            <input v-model="newPassword" type="password" required autocomplete="new-password">
          </label>
          <button class="button button-primary" type="submit">Change Password</button>
        </form>

        <!-- Create user -->
        <form v-if="session.user?.can_manage_admins" class="admin-form glass-lite" @submit.prevent="createUser">
          <h3>Create Admin</h3>
          <label>
            <span>Email</span>
            <input v-model="createEmail" type="email" required>
          </label>
          <label>
            <span>Display name</span>
            <input v-model="createDisplayName" type="text" required>
          </label>
          <label>
            <span>Admin title</span>
            <input v-model="createAdminTitle" type="text">
          </label>
          <label>
            <span>Password</span>
            <input v-model="createPassword" type="password" required autocomplete="new-password">
          </label>
          <label>
            <span>Role</span>
            <select v-model="createRole">
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
              <option value="viewer">viewer</option>
            </select>
          </label>
          <label class="checkbox-row">
            <input v-model="createManageAdmins" type="checkbox">
            <span>Can manage admins</span>
          </label>
          <button class="button button-primary" type="submit">Create User</button>
        </form>

        <!-- User list -->
        <div v-if="session.user?.can_manage_admins && users.length" class="admin-user-list">
          <h3>Admin Accounts</h3>
          <article v-for="user in users" :key="user.id" class="user-card glass-lite">
            <div class="user-head">
              <div>
                <h4>{{ user.display_name }}</h4>
                <p class="user-meta">{{ user.email }}</p>
              </div>
              <small>{{ user.role }}</small>
            </div>
            <div class="user-fields">
              <label>
                <span>Display name</span>
                <input v-model="user.display_name" type="text">
              </label>
              <label>
                <span>Admin title</span>
                <input v-model="user.admin_title" type="text">
              </label>
              <label>
                <span>Role</span>
                <select v-model="user.role">
                  <option value="admin">admin</option>
                  <option value="superadmin">superadmin</option>
                  <option value="viewer">viewer</option>
                </select>
              </label>
              <label class="checkbox-row">
                <input v-model="user.can_manage_admins" type="checkbox">
                <span>Can manage admins</span>
              </label>
              <label class="checkbox-row">
                <input v-model="user.active" type="checkbox">
                <span>Active</span>
              </label>
            </div>
            <div class="user-actions">
              <button class="button button-secondary" type="button" @click="saveUser(user)">Save changes</button>
            </div>
          </article>
        </div>
      </template>
    </section>
  </main>
</template>
