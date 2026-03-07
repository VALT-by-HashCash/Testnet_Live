<template>
  <div class="max-w-xl mx-auto p-4">
    <h2 class="text-lg font-medium mb-3">Verify email</h2>

    <label class="block mb-2">
      <span class="text-sm text-gray-400">Email</span>
      <input v-model="email" type="email" class="w-full mt-1 p-2 rounded bg-gray-800 text-white" />
    </label>

    <label class="block mb-3">
      <span class="text-sm text-gray-400">6‑digit code</span>
      <input v-model="code" type="text" maxlength="6" class="w-full mt-1 p-2 rounded bg-gray-800 text-white" />
    </label>

    <div class="flex items-center gap-2">
      <button @click="submit" :disabled="loading" class="px-4 py-2 bg-teal-500 rounded">
        {{ loading ? 'Verifying…' : 'Verify' }}
      </button>
      <div v-if="error" class="text-sm text-red-400">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api.js'

const email = ref('')
const code = ref('')
const error = ref(null)
const loading = ref(false)
const router = useRouter()

function storageKeyFor(email) {
  const e = (email || '').trim().toLowerCase()
  return `valt_next_claim_${e || 'anon'}`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function submit() {
  error.value = null
  if (!EMAIL_RE.test(email.value.trim())) {
    error.value = 'Enter a valid email address.'
    return
  }
  loading.value = true
  try {
    const payload = { email: email.value.trim(), token: code.value }
    const res = await api.profiles.verifyTestnetCode(payload)
    const user = res?.data?.user ?? res?.data ?? res
    if (!user?.email) throw new Error('No user returned from verification')

    // persist user
    localStorage.setItem('breadcrumbs_user', JSON.stringify(user))

    // ensure a next-claim timestamp is set so dashboard starts countdown
    const emailVal = (user.email || payload.email || '').trim().toLowerCase()
    const key = storageKeyFor(emailVal)
    let nextClaim = null
    if (user.nextClaimAt) {
      nextClaim = new Date(user.nextClaimAt)
    } else {
      // set optimistic 24h from now if server didn't provide nextClaimAt
      nextClaim = new Date(Date.now() + 24 * 3600 * 1000)
    }
    try { localStorage.setItem(key, nextClaim.toISOString()) } catch (e) {}

    // notify app & components
    window.dispatchEvent(new CustomEvent('breadcrumbs-auth-change', { detail: { isAuthenticated: true, user } }))

    // navigate to ConnectedDashboard
    try {
      await router.push({ name: 'ConnectedDashboard' })
    } catch {
      router.push('/dashboard').catch(() => {})
    }
  } catch (err) {
    if (err?.response && typeof err.response.data === 'string') {
      error.value = `Server error (${err.response.status})`
      console.error('Server HTML response:', err.response.data)
    } else {
      error.value = err?.message || 'Verification failed'
    }
    console.error('verifyCode failed', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* minimal local styles */
</style>