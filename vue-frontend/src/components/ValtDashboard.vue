<template>
  <div class="min-h-screen gradient-bg bg-black text-white overflow-x-hidden">
    <!-- Loading Indicator -->
    <div v-if="isLoading" class="flex justify-center items-center min-h-screen">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Navigation -->
      <nav class="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div class="px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <!-- Mobile Layout -->
          <div class="flex sm:hidden flex-col space-y-2">
            <div class="flex justify-center items-center">
              <img src="/svg/valt-logo.svg" alt="VALT Logo" class="h-12 w-12">
            </div>
            <div class="flex items-center justify-center gap-1 px-2">
              <div class="px-2 py-1 bg-gray-800 rounded-full flex items-center">
                <template v-if="signedIn">
                  <span class="text-xs text-gray-400 mr-1">VALT Points:</span>
                  <span class="text-xs font-medium">{{ balance }}</span>
                </template>
                <template v-else>
                  <span class="text-xs font-medium text-gray-400">Sign In to see your VALT Points</span>
                </template>
              </div>
              <nav class="flex gap-2 tab-scroll overflow-x-auto"></nav>
            </div>
          </div>

          <!-- Desktop Layout -->
          <div class="hidden sm:flex justify-between items-center">
            <div class="flex items-center">
              <img src="/svg/valt-logo.svg" alt="VALT Logo" class="h-16 w-16 lg:h-20 lg:w-20">
            </div>
            <div class="flex items-center gap-2">
              <div class="px-3 py-2 bg-gray-800 rounded-full flex items-center">
                <template v-if="signedIn">
                  <span class="text-xs text-gray-400 mr-2">VALT Points:</span>
                  <span class="text-sm font-medium">{{ balance }}</span>
                </template>
                <template v-else>
                  <span class="text-sm font-medium text-gray-400">Sign In to see your VALT Points</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Home Tab -->
      <div v-if="activeTab === 'Home'" class="p-4 sm:p-6 lg:p-8">
        <div class="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div class="max-w-4xl mx-auto text-center mb-10">
            <div class="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <h1 class="text-4xl sm:text-5xl font-light">Welcome, {{ username }}</h1>
            </div>

            <!-- Claim Rewards Section -->
            <div class="bg-gray-800/50 backdrop-blur rounded-2xl p-6 sm:p-8 mb-12">
              <div v-if="!rewardClaimed && !showCodeInput">
                <div class="flex items-center justify-center mb-6">
                  <div class="w-6 h-6 mr-2">🎁</div>
                  <h2 class="text-xl sm:text-2xl font-light">Claim Your Daily Testnet Code</h2>
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                  <input
                    v-model="valtKey"
                    type="email"
                    placeholder="Enter Email Associated with VALT Account"
                    class="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                    @keyup.enter="claimReward"
                  >
                  <button
                    @click="claimReward"
                    :disabled="!valtKey.trim() || loading || resendCooldown > 0"
                    class="mx-auto px-3 py-3 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:bg-gray-700 disabled:text-gray-400 whitespace-nowrap"
                  >
                    <span v-if="loading">Sending…</span>
                    <span v-else-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
                    <span v-else>Send Code</span>
                  </button>
                </div>
              </div>
              <div v-else-if="showCodeInput">
                <div class="flex items-center justify-center mb-6">
                  <div class="w-6 h-6 mr-2">📧</div>
                  <h2 class="text-xl sm:text-2xl font-light">Enter Verification Code</h2>
                </div>
                <div class="text-center mb-4">
                  <p class="text-gray-400">We sent a 6-digit code to</p>
                  <p class="text-white font-medium">{{ pendingEmail }}</p>
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                  <input
                    v-model="verificationCode"
                    type="text"
                    maxlength="6"
                    placeholder="123456"
                    class="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 text-center text-2xl tracking-widest"
                    @input="verificationCode = verificationCode.replace(/\D/g, '')"
                  >
                </div>
                <div class="flex gap-3 mt-4">
                  <button
                    @click="cancelVerification"
                    class="flex-1 px-3 py-3 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    @click="verifyCode"
                    :disabled="verificationCode.length !== 6 || verifying"
                    class="flex-1 px-3 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-700 disabled:text-gray-400"
                  >
                    <span v-if="verifying">Verifying...</span>
                    <span v-else>Verify & Claim</span>
                  </button>
                </div>
              </div>
              <div v-else>
                <div class="flex items-center justify-center mb-6">
                  <div class="w-6 h-6 mr-2 animate-pulse">⏰</div>
                  <h2 class="text-xl font-light">Next Reward Available In</h2>
                </div>
                <div class="flex justify-center space-x-4 text-2xl font-light">
                  <div class="bg-black/30 rounded-lg px-4 py-2">{{ String(timeLeft.hours).padStart(2, '0') }}h</div>
                  <div class="bg-black/30 rounded-lg px-4 py-2">{{ String(timeLeft.minutes).padStart(2, '0') }}m</div>
                  <div class="bg-black/30 rounded-lg px-4 py-2 animate-pulse">{{ String(timeLeft.seconds).padStart(2, '0') }}s</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Connect Tab -->
      <div v-if="activeTab === 'Connect'" class="p-4 sm:p-6 lg:p-8">
        <ConnectedDashboard
          :signedIn="signedIn"
          :email="currentEmail"
          @signed-in="handleSignedIn"
          @claim="handleClaimFromConnected"
        />
      </div>
    </div>

    <!-- Toast Notifications -->
    <div v-if="toast.show" class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
      <div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg v-if="toast.type === 'success'" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">{{ toast.title }}</p>
              <p class="mt-1 text-sm text-gray-500">{{ toast.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import apiClient from '../services/api.js'
import ConnectedDashboard from './ConnectedDashboard.vue'

import { useCountdown } from '../composables/useCountdown.js'
import { useToast } from '../composables/useToast.js'
import { useOtpFlow } from '../composables/useOtpFlow.js'

// ── Core state ────────────────────────────────────────────────────────────────
const isLoading = ref(true)
const activeTab = ref('Home')
const signedIn = ref(false)
const currentEmail = ref('')
const username = ref('Guest')
const balance = ref(0)
const dailyPoints = ref(0)
const totalPoints = ref(0)

// ── Composables ───────────────────────────────────────────────────────────────
const { toast, showToast } = useToast()

const { countdown, rewardClaimed, timeLeft, startTimer, stopTimer } = useCountdown()

const {
  valtKey,
  pendingEmail,
  verificationCode,
  showCodeInput,
  verifying,
  loading,
  resendCooldown,
  claimReward,
  cancelVerification,
  clearCooldown,
  verifyCode
} = useOtpFlow({
  signedIn,
  username,
  balance,
  totalPoints,
  dailyPoints,
  currentEmail,
  countdown,
  activeTab,
  showToast
})

// ── Event handlers from ConnectedDashboard ────────────────────────────────────
function handleSignedIn(payload) {
  signedIn.value = true
  if (payload?.username) username.value = payload.username
  if (payload?.balance != null) balance.value = payload.balance
  if (payload?.email) currentEmail.value = payload.email
}

async function handleClaimFromConnected(payload = {}) {
  const email = (payload.email || currentEmail.value || pendingEmail.value || '').trim().toLowerCase() || 'anon'
  const key = `valt_next_claim_${email}`
  try {
    await apiClient.profiles.testnetReward({ email })

    const incomingClaimAt = Number(payload.claimAt) || (Math.floor(Date.now() / 1000) + 24 * 3600)
    const storedClaimAt = Number(localStorage.getItem('claim_available_at') || 0)
    const claimAtUnix = incomingClaimAt > storedClaimAt ? incomingClaimAt : storedClaimAt || incomingClaimAt
    localStorage.setItem(key, new Date(claimAtUnix * 1000).toISOString())
    localStorage.setItem('claim_available_at', String(claimAtUnix))
    countdown.value = Math.max(0, claimAtUnix - Math.floor(Date.now() / 1000))
    rewardClaimed.value = true
    showToast('success', 'Claimed', 'You claimed your daily reward.')
    console.log('handleClaimFromConnected: persisted', { key, claimAtUnix, email, storedClaimAt })
  } catch (e) {
    localStorage.removeItem(key)
    localStorage.removeItem('claim_available_at')
    window.dispatchEvent(new StorageEvent('storage', { key }))
    const errMsg = e?.response?.data?.error || e?.response?.data?.message || 'Claim failed. Please try again.'
    showToast('error', 'Claim Failed', errMsg)
    console.warn('handleClaimFromConnected: server rejected claim', e)
  }
}

// ── Dashboard data loading ────────────────────────────────────────────────────
async function loadDashboardData() {
  try {
    loading.value = true
    try {
      const response = await apiClient.valt.dashboard.stats()
      if (response?.data) {
        console.log('API data loaded:', response.data)
      }
    } catch {
      console.log('Using demo data - API not available')
    }
    console.log('Dashboard data loaded successfully')
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    showToast('error', 'Error', 'Using demo data - backend may be unavailable')
  } finally {
    loading.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
let progressTimer = null

onMounted(async () => {
  pendingEmail.value = localStorage.getItem('valt_pending_email') || ''

  // Do not auto-restore signedIn from localStorage — require explicit sign-in each session

  const storedClaimAt = Number(localStorage.getItem('claim_available_at') || 0)
  if (storedClaimAt > 0) {
    countdown.value = Math.max(0, storedClaimAt - Math.floor(Date.now() / 1000))
  }

  const loadingTimeout = setTimeout(() => {
    if (isLoading.value) {
      console.warn('Loading timeout reached, showing demo data')
      isLoading.value = false
      showToast('info', 'Demo Mode', 'Using demo data - backend may be unavailable')
    }
  }, 5000)

  try {
    await loadDashboardData()
  } catch (error) {
    console.error('Failed to load dashboard:', error)
    showToast('error', 'Error', 'Failed to load dashboard - using demo data')
  } finally {
    clearTimeout(loadingTimeout)
    isLoading.value = false
  }

  startTimer()

  progressTimer = setInterval(() => {}, 5000)
})

onUnmounted(() => {
  stopTimer()
  clearCooldown()
  if (progressTimer) clearInterval(progressTimer)
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.gradient-bg {
  background: linear-gradient(135deg, #1f2937 0%, #000000 100%);
}

.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.tab-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-scroll::-webkit-scrollbar {
  display: none;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
