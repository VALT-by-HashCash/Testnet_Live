<template>
  <div class="max-w-5xl mx-auto">
    <!-- Hero -->
    <!-- <section class="text-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <h2 class="text-2xl sm:text-3xl font-light mb-4">Connected Dashboard</h2>
      <p class="text-sm sm:text-base text-gray-400 mb-6">
        Overview of your account and connected apps. Mobile-first and fully responsive.
      </p> -->

      <!-- Hero: compact horizontal stat chips (icons + numbers) -->
      <!-- <div class="flex flex-row flex-wrap items-center justify-center gap-3 mb-8"> -->
        <!-- VALT points (Phosphorous Gift icon) -->
        <!-- <div class="stat-card-row flex flex-col items-center justify-center gap-2 bg-gray-900/60 rounded-2xl p-3 px-4 shadow-lg hover:shadow-2xl transition-shadow duration-200">
          <div class="mb-1">
            <img :src="giftIcon" alt="Phosphorous Gift" class="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          </div>
          <div class="text-block text-center">
            <div class="text-xs text-gray-400">VALT points</div>
            <div class="text-lg sm:text-xl font-light">{{ balance }}</div>
          </div>
        </div> -->

        <!-- Daily Points (Phosphorous Sun icon) -->
        <!-- <div class="stat-card-row flex flex-col items-center justify-center gap-2 bg-gray-900/60 rounded-2xl p-3 px-4 shadow-lg hover:shadow-2xl transition-shadow duration-200">
          <div class="mb-1">
            <img :src="sunIcon" alt="Phosphorous Sun" class="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          </div>
          <div class="text-block text-center">
            <div class="text-xs text-gray-400">Daily Points</div>
            <div class="text-lg sm:text-xl font-light">{{ dailyPoints }}</div>
          </div>
        </div> -->

        <!-- Total Points (Phosphorous Medal icon) -->
        <!-- <div class="stat-card-row flex flex-col items-center justify-center gap-2 bg-gray-900/60 rounded-2xl p-3 px-4 shadow-lg hover:shadow-2xl transition-shadow duration-200">
          <div class="mb-1">
            <img :src="medalIcon" alt="Phosphorous Medal" class="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          </div>
          <div class="text-block text-center">
            <div class="text-xs text-gray-400">Total Points</div>
            <div class="text-lg sm:text-xl font-light">{{ totalPoints }}</div>
          </div>
        </div>
      </div>-->
    <!-- </section> -->

    <!-- Stats horizontal row -->
    <!-- <section class="px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex flex-row flex-wrap items-center justify-center gap-3"> -->

        <!-- Daily Actions: icon moved on top -->
        <!-- <div class="stat-card-row flex flex-col items-center justify-center gap-2 bg-gray-900/50 rounded-2xl p-3 px-4 shadow-lg hover:shadow-2xl transition-shadow duration-200">
          <div class="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-lg sm:text-xl mb-1">📅</div>
          <div class="text-block text-center">
            <div class="text-xs text-gray-400">Daily Actions</div>
            <div class="text-xl font-light">{{ dailyActions }}</div>
            <div class="text-xs text-gray-500">Collected Today</div>
          </div>
        </div> -->

        <!-- Total Actions Card (icon on top) -->
        <!-- <div class="stat-card-row flex flex-col items-center justify-center gap-2 bg-gray-900/50 rounded-2xl p-3 px-4 shadow-lg hover:shadow-2xl transition-shadow duration-200">
          <div class="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-lg sm:text-xl mb-1">⚡</div>
          <div class="text-block text-center">
            <div class="text-xs text-gray-400">Total Actions</div>
            <div class="text-xl font-light">{{ totalActions }}</div>
            <div class="text-xs text-gray-500">All Time Collected</div>
          </div>
        </div> -->

        <!-- Connected Apps Card (icon on top) -->
        <!-- <div class="stat-card-row flex flex-col items-center justify-center gap-2 bg-gray-900/50 rounded-2xl p-3 px-4 shadow-lg hover:shadow-2xl transition-shadow duration-200">
          <div class="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-lg sm:text-xl mb-1">🧩</div>
          <div class="text-block text-center">
            <div class="text-xs text-gray-400">Connected Apps</div>
            <div class="text-xl font-light">{{ connectedApps }}</div>
            <div class="text-xs text-gray-500">Active Connections</div>
          </div>
        </div> -->

      <!-- </div>
    </section> -->

    <!-- Claim / Verification block -->
    <section class="px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-gray-800/50 rounded-2xl p-4 sm:p-6">
        <div class="mt-0 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-1/2 mx-auto text-center">
          <div class="text-xs text-gray-400">Next claim in</div>

          <div class="text-lg font-mono text-white">
            {{ remainingText }}
          </div>

          <button
            @click="claim"
            :disabled="!canClaim"
            class="px-4 py-2 rounded-lg font-medium transition-colors"
            :class="canClaim ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-700 text-gray-400 cursor-not-allowed'"
          >
            Claim Points
          </button>
        </div>

        <!-- <p class="text-xs text-gray-400 mt-3">
          When connected, your VALT points and connected apps will appear here.
        </p> -->
      </div>
    </section>

    <!-- Leaderboard / Goals -->
    <section class="px-4 sm:px-6 lg:px-8 py-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-900/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <h3 class="text-sm font-medium text-gray-300 mb-2">Rank</h3>
          <div class="text-3xl font-light">#{{ globalRank || '—' }}</div>
        </div>
        <!-- <div class="bg-gray-900/50 rounded-2xl p-4">
          <h3 class="text-sm font-medium text-gray-300 mb-2">Goals Progress</h3>
          <div class="w-full bg-black/20 rounded-full h-3 overflow-hidden mt-2">
            <div class="bg-green-500 h-3 rounded-full" :style="{ width: goalProgress + '%' }"></div>
          </div>
        </div> -->
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
const emit = defineEmits(['signed-in','claim'])

// icon imports — using the project's assets/icons folder
import giftIcon from '../assets/icons/Phosphorous Gift Icon.png'
import medalIcon from '../assets/icons/Phosphorous Medal Icon.png'
import sunIcon from '../assets/icons/Phosphorous Sun Icon.svg'

const props = defineProps({
  signedIn: { type: Boolean, default: false },
  email: { type: String, default: '' }
})

/* state */
const valtKey = ref('')
const balance = ref(0)
const dailyPoints = ref('')
const totalPoints = ref('')
const dailyActions = ref('')
const totalActions = ref('')
const connectedApps = ref('')
const globalRank = ref()
const goalProgress = ref('')

const intervalId = ref(null)
const nextClaimAt = ref(null)
const remaining = ref(0)

function storageKeyFor(email) {
  const id = (email || '').trim().toLowerCase() || 'anon'
  return `valt_next_claim_${id}`
}

function loadNextClaim(email) {
  try {
    const target = (email || props.email || valtKey.value || '').trim().toLowerCase()
    const userKey = storageKeyFor(target)
    let v = localStorage.getItem(userKey)

    // fallback to global unix key (stored by ValtDashboard or other places)
    if (!v) {
      const claimUnix = Number(localStorage.getItem('claim_available_at') || 0)
      if (claimUnix > 0) v = new Date(claimUnix * 1000).toISOString()
    }

    nextClaimAt.value = v ? new Date(v) : null
  } catch {
    nextClaimAt.value = null
  }
}

function saveNextClaim(dt, email) {
  try {
    const target = (email || props.email || valtKey.value || '').trim().toLowerCase()
    const userKey = storageKeyFor(target)
    localStorage.setItem(userKey, dt.toISOString())
    // also store a global unix timestamp so other components (or refreshes) can easily read
    localStorage.setItem('claim_available_at', String(Math.floor(dt.getTime() / 1000)))
    nextClaimAt.value = dt
  } catch {}
}

function loadProfileFromStorage() {
  try {
    console.log('loadProfileFromStorage: start')

    // 1) direct top-level keys (your case)
    const r = localStorage.getItem('valt_rank')
    if (r != null) {
      const data = {
        rank: Number(r),
        points: Number(localStorage.getItem('valt_points') || 0),
        profile_balance: Number(localStorage.getItem('valt_profile_balance') || 0),
        connected_apps: Number(localStorage.getItem('valt_connected_apps') || 0),
        last_visit: Number(localStorage.getItem('valt_last_visit') || 0)
      }
      console.log('loadProfileFromStorage: loaded direct keys', data)
      globalRank.value = Number(data.rank)
      balance.value = Number(data.profile_balance)
      totalPoints.value = Number(data.points)
      connectedApps.value = Number(data.connected_apps)
      return
    }

    // 2) try common wrapped keys
    const tryKeys = ['breadcrumbs_user','valt_user','valt_profile','user']
    let obj = null
    let data = null
    for (const k of tryKeys) {
      const raw = localStorage.getItem(k)
      if (!raw) continue
      try { obj = JSON.parse(raw) } catch { continue }
      data = obj?.data || obj?.user || obj?.profile || obj
      if (data?.rank != null) {
        console.log('loadProfileFromStorage: found under key', k, data)
        break
      }
      data = null
    }

    // 3) scan all keys as a last resort
    if (!data) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        const raw = localStorage.getItem(key)
        try { obj = JSON.parse(raw) } catch { continue }
        data = obj?.data || obj?.user || obj?.profile || obj
        if (data?.rank != null) {
          console.log('loadProfileFromStorage: found profile under key', key, data)
          break
        }
        data = null
      }
    }

    if (!data) {
      console.log('loadProfileFromStorage: no profile data found')
      return
    }

    // assign known fields (coerce to Number)
    if (data.rank != null) globalRank.value = Number(data.rank)
    if (data.profile_balance != null) balance.value = Number(data.profile_balance)
    if (data.points != null) totalPoints.value = Number(data.points)
    if (data.connected_apps != null) connectedApps.value = Number(data.connected_apps)

    console.log('loadProfileFromStorage: assigned', { globalRank: globalRank.value, balance: balance.value, totalPoints: totalPoints.value })
  } catch (e) {
    console.warn('loadProfileFromStorage error', e)
  }
}

function storageHandler(e) {
  if (!e) return
  if (e.key === 'claim_available_at' || (e.key && e.key.startsWith('valt_next_claim_'))) {
    // reload for the currently relevant email
    loadNextClaim(props.email || valtKey.value)
    // restart timer so UI reflects updated value immediately
    startTimer()
  }
  // if user/profile changed in another tab or simple profile keys changed
  if (
    e.key === 'breadcrumbs_user' ||
    e.key === 'valt_user' ||
    e.key === 'valt_profile' ||
    e.key === 'user' ||
    e.key === 'valt_rank' ||
    e.key === 'valt_points' ||
    e.key === 'valt_profile_balance' ||
    e.key === 'valt_connected_apps' ||
    e.key === 'valt_last_visit'
  ) {
    loadProfileFromStorage()
  }
}

function startTimer() {
  stopTimer()
  updateRemaining()
  intervalId.value = setInterval(updateRemaining, 1000)
}

function stopTimer() {
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
}

function updateRemaining() {
  if (!nextClaimAt.value) {
    remaining.value = 0
    return
  }
  const diffMs = nextClaimAt.value.getTime() - Date.now()
  const secs = Math.max(0, Math.floor(diffMs / 1000))
  remaining.value = secs
  if (secs <= 0) stopTimer()
}

const remainingText = computed(() => {
  if (!props.signedIn) return '—'
  if (!nextClaimAt.value || remaining.value <= 0) return 'You can claim now'
  const h = Math.floor(remaining.value / 3600)
  const m = Math.floor((remaining.value % 3600) / 60)
  const s = remaining.value % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const canClaim = computed(() => props.signedIn && remaining.value <= 0)

watch(() => props.signedIn, (isSigned) => {
  if (isSigned) {
    loadNextClaim(props.email || valtKey.value)
    loadProfileFromStorage()
    startTimer()
  } else {
    stopTimer()
  }
})

function applyProfileData(p) {
  try {
    if (!p) return
    // server returns { rank, points, last_visit, connected_apps, profile_balance, ... }
    const data = p?.data ? p.data : p

    // persist both individual simple keys and a wrapped profile object
    if (data.rank != null) localStorage.setItem('valt_rank', String(data.rank))
    if (data.points != null) localStorage.setItem('valt_points', String(data.points))
    if (data.profile_balance != null) localStorage.setItem('valt_profile_balance', String(data.profile_balance))
    if (data.connected_apps != null) localStorage.setItem('valt_connected_apps', String(data.connected_apps))
    if (data.last_visit != null) localStorage.setItem('valt_last_visit', String(data.last_visit))

    // also store a wrapped object for other loaders to use
    try { localStorage.setItem('valt_profile', JSON.stringify({ success: true, data })) } catch(e){}

    // update reactive state immediately
    if (data.rank != null) globalRank.value = Number(data.rank)
    if (data.profile_balance != null) balance.value = Number(data.profile_balance)
    if (data.points != null) totalPoints.value = Number(data.points)
    if (data.connected_apps != null) connectedApps.value = Number(data.connected_apps)

    console.log('applyProfileData: applied', data)
    // let other tabs/components know (storage event is fired for other tabs, but dispatch a custom event too)
    window.dispatchEvent(new Event('profile-updated'))
  } catch (e) {
    console.warn('applyProfileData error', e)
  }
}

function profileDataHandler(e) {
  applyProfileData(e.detail)
}

onMounted(() => {
  // always try to hydrate profile and claim state from storage on mount
  loadProfileFromStorage()
  loadNextClaim(props.email || valtKey.value)
  if (props.signedIn) startTimer()
  window.addEventListener('storage', storageHandler)
  window.addEventListener('valt-profile-data', profileDataHandler)
})

onUnmounted(() => {
  stopTimer()
  window.removeEventListener('storage', storageHandler)
  window.removeEventListener('valt-profile-data', profileDataHandler)
})

// reload when the email prop changes (parent may verify and set current email)
watch(() => props.email, (newEmail) => {
  if (props.signedIn) {
    loadNextClaim(newEmail || valtKey.value)
    startTimer()
    loadProfileFromStorage()
  }
})

function handleConnect() {
  const emailToEmit = (props.email || valtKey.value || '').trim()
  emit('signed-in', { username: (emailToEmit.split('@')[0] || 'user'), balance: balance.value, email: emailToEmit })
  loadNextClaim(props.email || valtKey.value)
  if (!nextClaimAt.value) {
    saveNextClaim(new Date(Date.now() + 24 * 3600 * 1000), props.email || valtKey.value)
  }
  startTimer()
}

function claim() {
  if (!canClaim.value) return
  const email = (props.email || valtKey.value || '').trim()
  emit('claim', { email })
  saveNextClaim(new Date(Date.now() + 24 * 3600 * 1000), email)
  startTimer()
}

// use centralized saveNextClaim in onClaimSuccess
function onClaimSuccess(userEmail) {
  const email = (userEmail || '').trim().toLowerCase() || 'anon'
  const nextUnix = Math.floor(Date.now() / 1000) + 24 * 3600
  const dt = new Date(nextUnix * 1000)
  saveNextClaim(dt, email)

  console.log('ConnectedDashboard: claim persisted', { email, nextUnix })
  emit('claim', { email, claimAt: nextUnix })
}
</script>

<style scoped>
.rounded-2xl { transition: box-shadow .2s ease; }
@media (min-width: 640px) {
  .rounded-2xl { box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
}
.stat-card { display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(0,0,0,0.35); transition: box-shadow .2s ease; }
.stat-card:hover { box-shadow: 0 12px 36px rgba(0,0,0,0.45); }
.stat-card-row { min-width: 180px; max-width: 320px; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.32); transition: box-shadow .2s ease; }
.stat-card-row:hover { box-shadow: 0 12px 36px rgba(0,0,0,0.44); }
.icon-wrap { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; line-height: 0; flex-shrink: 0; border-radius: 9999px; overflow: hidden; }
.icon-wrap svg, .icon { display: block; width: 20px !important; height: 20px !important; }
.stat-card .icon-wrap, .stat-card-row .icon-wrap { width: 40px; height: 40px; }
.stat-card .icon-wrap svg, .stat-card_row .icon-wrap svg { width: 18px !important; height: 18px !important; }
.text-block { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
@media (min-width: 640px) { .icon-wrap { width: 48px; height: 48px; } .icon-wrap svg { width: 22px !important; height: 22px !important; } .stat-card .icon-wrap svg { width: 20px !important; height: 20px !important; } }
@media (max-width: 420px) { .stat-card { width: 110px; } .stat-card-row { min-width: 150px; max-width: 220px; gap: 8px; } }
</style>