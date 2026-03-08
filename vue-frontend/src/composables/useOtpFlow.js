import { ref } from 'vue'
import apiClient from '../services/api.js'

/**
 * Manages the OTP send/verify/cancel lifecycle.
 *
 * @param {object} ctx - external reactive refs and helpers from the parent component
 * @param {import('vue').Ref} ctx.signedIn
 * @param {import('vue').Ref} ctx.username
 * @param {import('vue').Ref} ctx.balance
 * @param {import('vue').Ref} ctx.totalPoints
 * @param {import('vue').Ref} ctx.dailyPoints
 * @param {import('vue').Ref} ctx.currentEmail
 * @param {import('vue').Ref} ctx.countdown
 * @param {import('vue').Ref} ctx.activeTab
 * @param {Function} ctx.showToast
 */
export function useOtpFlow({
  signedIn,
  username,
  balance,
  totalPoints,
  dailyPoints,
  currentEmail,
  countdown,
  activeTab,
  showToast
}) {
  const valtKey = ref('')
  const pendingEmail = ref('')
  const verificationCode = ref('')
  const showCodeInput = ref(false)
  const verifying = ref(false)
  const loading = ref(false)
  const resendCooldown = ref(0)
  let _cooldownTimer = null

  function startCooldown(seconds = 60) {
    resendCooldown.value = seconds
    clearInterval(_cooldownTimer)
    _cooldownTimer = setInterval(() => {
      if (resendCooldown.value > 0) {
        resendCooldown.value--
      } else {
        clearInterval(_cooldownTimer)
      }
    }, 1000)
  }

  function clearCooldown() {
    clearInterval(_cooldownTimer)
    resendCooldown.value = 0
  }

  async function claimReward() {
    // DEV: simulate token locally to avoid sending real email
    if (import.meta.env.MODE === 'development') {
      loading.value = true
      await new Promise((r) => setTimeout(r, 400))
      pendingEmail.value = valtKey.value.trim()
      localStorage.setItem('valt_pending_email', pendingEmail.value)
      showCodeInput.value = true
      const fakeToken = String(Math.floor(100000 + Math.random() * 900000))
      console.log('DEV: simulated verification token for', pendingEmail.value, fakeToken)
      localStorage.setItem(`dev_test_token_${pendingEmail.value.toLowerCase()}`, fakeToken)
      showToast('success', 'Code Sent (DEV)', `Verification code: ${fakeToken}`)
      loading.value = false
      return
    }

    try {
      if (!valtKey.value || !valtKey.value.trim()) {
        showToast('error', 'Missing', 'Enter an email to send a code.')
        return
      }
      loading.value = true
      const email = valtKey.value.trim()
      const res = await apiClient.profiles.sendTestnetCode({ email })
      const data = res?.data || {}
      if (data?.success !== false) {
        pendingEmail.value = email
        localStorage.setItem('valt_pending_email', pendingEmail.value)
        showCodeInput.value = true
        startCooldown(60)
        showToast('success', 'Code Sent', `Verification code sent to ${pendingEmail.value}`)
      } else {
        const err = data?.error || data?.message || 'Failed to send code'
        showToast('error', 'Send Failed', err)
      }
    } catch (e) {
      console.error('claimReward error', e)
      const serverMsg = e?.response?.data?.error || e?.response?.data?.message
      showToast('error', 'Error', serverMsg || 'Network error while sending code.')
    } finally {
      loading.value = false
    }
  }

  function cancelVerification() {
    showCodeInput.value = false
    verificationCode.value = ''
    pendingEmail.value = ''
    try { localStorage.removeItem('valt_pending_email') } catch {}
    showToast('info', 'Cancelled', 'Verification cancelled.')
  }

  async function verifyCode() {
    if (!pendingEmail.value) {
      if (valtKey.value && valtKey.value.trim()) {
        await claimReward()
        return showToast('info', 'Code Sent', `Verification code sent to ${valtKey.value}`)
      }
      return showToast('error', 'Missing', 'No pending email — click "Send Code" first.')
    }

    if (!verificationCode.value.trim()) {
      return showToast('error', 'Missing', 'Provide code and email.')
    }

    // DEV: accept the simulated token stored by claimReward
    if (import.meta.env.MODE === 'development') {
      const devKey = `dev_test_token_${(pendingEmail.value || '').toLowerCase()}`
      const storedToken = localStorage.getItem(devKey)
      if (!storedToken) {
        console.warn('verifyCode (DEV): no dev token found in localStorage for', pendingEmail.value)
        return showToast('error', 'Dev Token Missing', 'No dev token found. Click "Send Code" to simulate one.')
      }
      if (storedToken !== verificationCode.value.trim()) {
        console.warn('verifyCode (DEV): invalid token', { expected: storedToken, provided: verificationCode.value })
        return showToast('error', 'Invalid Token', 'The token you entered does not match the simulated dev token.')
      }

      signedIn.value = true
      username.value = pendingEmail.value.split('@')[0] || pendingEmail.value
      const awarded = 10
      totalPoints.value += awarded
      dailyPoints.value += awarded
      balance.value += awarded
      currentEmail.value = pendingEmail.value

      const claimAt = Math.floor(Date.now() / 1000) + 24 * 3600
      localStorage.setItem('claim_available_at', String(claimAt))
      const userKey = `valt_next_claim_${(currentEmail.value || '').trim().toLowerCase() || 'anon'}`
      try { localStorage.setItem(userKey, new Date(claimAt * 1000).toISOString()) } catch {}
      countdown.value = Math.max(0, claimAt - Math.floor(Date.now() / 1000))
      localStorage.setItem('valt_current_email', currentEmail.value)

      console.log('verifyCode (DEV): success', { email: currentEmail.value, claimAt })
      activeTab.value = 'Connect'

      pendingEmail.value = ''
      localStorage.removeItem('valt_pending_email')
      verificationCode.value = ''
      showCodeInput.value = false

      return showToast('success', 'Verified (DEV)', `Simulated verification succeeded, awarded ${awarded} points.`)
    }

    // Production / normal flow
    verifying.value = true
    try {
      const email = pendingEmail.value
      const otp = verificationCode.value.trim()
      const res = await apiClient.profiles.verifyTestnetCode({ email, code: otp, otp })
      const data = res?.data || {}

      if (data?.error && String(data.error).toLowerCase().includes('no associated profile')) {
        console.warn('verifyCode: no profile for email', pendingEmail.value)
        showToast('error', 'No Profile', 'No associated profile found. Click "Send Code" to create/send a code first.')
        verificationCode.value = ''
        showCodeInput.value = false
        return
      }

      if (data?.success) {
        signedIn.value = true
        username.value = pendingEmail.value.split('@')[0] || pendingEmail.value
        const profile = data.data || data
        if (profile.profile_balance != null) balance.value = profile.profile_balance
        if (profile.points) {
          totalPoints.value += profile.points
          dailyPoints.value += profile.points
        }

        currentEmail.value = pendingEmail.value
        const claimAtFromServer = Number(data.claim_available_at || data.data?.claim_available_at) || 0
        const nowUnix = Math.floor(Date.now() / 1000)
        // Only honour a server-provided future timestamp — never impose a default 24h wait
        const claimAt = claimAtFromServer > nowUnix ? claimAtFromServer : 0
        if (claimAt > 0) {
          try { localStorage.setItem('claim_available_at', String(claimAt)) } catch (e) {}
          const userKey = `valt_next_claim_${(currentEmail.value || '').trim().toLowerCase() || 'anon'}`
          try {
            if (!localStorage.getItem(userKey)) {
              localStorage.setItem(userKey, new Date(claimAt * 1000).toISOString())
            }
          } catch (e) {}
        } else {
          try { localStorage.removeItem('claim_available_at') } catch (e) {}
        }
        countdown.value = Math.max(0, claimAt - nowUnix)
        localStorage.setItem('valt_current_email', currentEmail.value)
        if (activeTab.value !== 'Connect') activeTab.value = 'Connect'

        pendingEmail.value = ''
        localStorage.removeItem('valt_pending_email')
        verificationCode.value = ''
        showCodeInput.value = false

        try {
          const profile = data.data || data
          if (profile.rank != null) localStorage.setItem('valt_rank', String(profile.rank))
          if (profile.points != null) localStorage.setItem('valt_points', String(profile.points))
          if (profile.profile_balance != null) localStorage.setItem('valt_profile_balance', String(profile.profile_balance))
          if (profile.connected_apps != null) localStorage.setItem('valt_connected_apps', String(profile.connected_apps))
          if (profile.last_visit != null) localStorage.setItem('valt_last_visit', String(profile.last_visit))
          try { localStorage.setItem('valt_profile', JSON.stringify({ success: true, data: profile })) } catch (e) {}
          window.dispatchEvent(new CustomEvent('valt-profile-data', { detail: profile }))
        } catch (e) {
          console.warn('persist profile error', e)
        }

        showToast('success', 'Verified', data.message || 'Points awarded.')
      } else {
        const errMsg = data?.error || data?.message || 'Verification failed'
        console.error('verifyCode failed', { status: res?.status, data })
        showToast('error', 'Verification Failed', errMsg)
      }
    } catch (err) {
      console.error('verify error', err)
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message
      showToast('error', 'Error', serverMsg || 'Network error while verifying code.')
    } finally {
      verifying.value = false
    }
  }

  return {
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
  }
}
