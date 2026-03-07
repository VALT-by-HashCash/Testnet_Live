/**
 * Edge Case & Weakness Tests
 *
 * These tests document and probe known weaknesses, bugs, and improvement areas
 * identified in the codebase analysis (see src/test/ANALYSIS.md).
 *
 * Tests are grouped by finding number from ANALYSIS.md.
 * Some tests are marked with TODO comments where a fix would make them pass.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
  RouterView: { template: '<div />' }
}))

vi.mock('../../services/api.js', () => ({
  default: {
    profiles: {
      sendTestnetCode: vi.fn(),
      verifyTestnetCode: vi.fn(),
      signOut: vi.fn().mockResolvedValue({})
    },
    valt: {
      dashboard: {
        stats: vi.fn().mockResolvedValue({ data: null })
      }
    }
  }
}))

import VerifyTestnet from '../../components/VerifyTestnet.vue'
import ConnectedDashboard from '../../components/ConnectedDashboard.vue'
import ValtDashboard from '../../components/ValtDashboard.vue'
import apiClient from '../../services/api.js'
import { authService } from '../../services/auth.js'

// ---------------------------------------------------------------------------
// Shared mount helpers
// ---------------------------------------------------------------------------

function mountVerify() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(VerifyTestnet, { global: { plugins: [pinia] } })
}

function mountConnected(props = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(ConnectedDashboard, {
    props: { signedIn: false, email: '', ...props },
    global: { plugins: [pinia] }
  })
}

const ConnectedDashboardStub = {
  name: 'ConnectedDashboard',
  template: '<div />',
  props: ['signedIn', 'email'],
  emits: ['signed-in', 'claim']
}

function mountValtDashboard() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(ValtDashboard, {
    global: {
      plugins: [pinia],
      stubs: { ConnectedDashboard: ConnectedDashboardStub }
    }
  })
}

// ---------------------------------------------------------------------------
// Finding #1 — VerifyTestnet: null-check does not catch { user: null }
// ---------------------------------------------------------------------------

describe('Finding #1 — VerifyTestnet null-check bug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('FIXED: { data: { user: null } } correctly triggers "No user returned" error', async () => {
    // The null-check now uses `if (!user?.email)` so { data: { user: null } }
    // correctly surfaces an error instead of silently failing.
    apiClient.profiles.verifyTestnetCode.mockResolvedValue({ data: { user: null } })

    const wrapper = mountVerify()
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
    await wrapper.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const errorEl = wrapper.find('.text-red-400')
    expect(errorEl.exists()).toBe(true)
    expect(errorEl.text()).toContain('No user returned')
  })

  it('FIXED PATH: returning null (not wrapped) correctly triggers "No user returned"', async () => {
    // Only `mockResolvedValue(null)` triggers the error correctly today
    apiClient.profiles.verifyTestnetCode.mockResolvedValue(null)

    const wrapper = mountVerify()
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
    await wrapper.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.text-red-400').text()).toContain('No user returned')
  })

  it('FIXED: empty object response correctly triggers "No user returned" error', async () => {
    // {} has no .email so `!user?.email` is true — error is now correctly surfaced.
    apiClient.profiles.verifyTestnetCode.mockResolvedValue({})

    const wrapper = mountVerify()
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
    await wrapper.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const errorEl = wrapper.find('.text-red-400')
    expect(errorEl.exists()).toBe(true)
    expect(errorEl.text()).toContain('No user returned')
  })
})

// ---------------------------------------------------------------------------
// Finding #4 — ConnectedDashboard: window.applyProfileData() global exposure
// ---------------------------------------------------------------------------

describe('Finding #4 — FIXED: Global applyProfileData XSS surface removed', () => {
  beforeEach(() => localStorage.clear())

  it('FIXED: window.applyProfileData is no longer exposed after component mounts', () => {
    mountConnected({ signedIn: true, email: 'test@example.com' })
    // Function is no longer attached to window — external scripts cannot call it
    expect(typeof window.applyProfileData).toBe('undefined')
  })

  it('FIXED: external scripts cannot overwrite rank via window.applyProfileData', async () => {
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()

    // Attempting to call the (now removed) global function does nothing
    if (typeof window.applyProfileData === 'function') {
      window.applyProfileData({ rank: 1, points: 999999, profile_balance: 99999 })
    }
    await wrapper.vm.$nextTick()

    // Rank remains at its initial value — not spoofed by external caller
    expect(wrapper.vm.globalRank).not.toBe(1)
  })

  it('FIXED: window.applyProfileData no longer persists spoofed data to localStorage', () => {
    mountConnected({ signedIn: true, email: 'test@example.com' })
    if (typeof window.applyProfileData === 'function') {
      window.applyProfileData({ rank: 999, points: 1 })
    }
    // Nothing was written to localStorage by an external caller
    expect(localStorage.getItem('rank')).toBeNull()
    expect(localStorage.getItem('points')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Finding #5 — ConnectedDashboard: client-only claim cooldown
// ---------------------------------------------------------------------------

describe('Finding #5 — Claim cooldown is client-only (localStorage manipulation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('clearing the localStorage key immediately re-enables the claim button', async () => {
    // Set a future claim (cooldown active)
    const futureDate = new Date(Date.now() + 24 * 3600 * 1000)
    localStorage.setItem('valt_next_claim_test@example.com', futureDate.toISOString())

    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()

    // Button is disabled (cooldown active)
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()

    // Simulate user clearing the key in DevTools
    localStorage.removeItem('valt_next_claim_test@example.com')

    // Trigger the storage event that the component listens to
    const event = new StorageEvent('storage', { key: 'valt_next_claim_test@example.com' })
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // BUG: button is now enabled — cooldown was bypassed entirely client-side
    // TODO: claim() should call a server endpoint that enforces the cooldown
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })

  it('claim() method does not call any API endpoint', async () => {
    const pastDate = new Date(Date.now() - 1000)
    localStorage.setItem('valt_next_claim_test@example.com', pastDate.toISOString())

    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await wrapper.find('button').trigger('click')

    // No API call is made — claim is purely local
    expect(apiClient.profiles.sendTestnetCode).not.toHaveBeenCalled()
    expect(apiClient.profiles.verifyTestnetCode).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Finding #7 — ValtDashboard: no rate limiting on "Send Code"
// ---------------------------------------------------------------------------

describe('Finding #7 — No rate limiting on Send Code button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiClient.valt.dashboard.stats.mockResolvedValue({ data: null })
  })

  it('Send Code button IS disabled while the first request is in-flight (loading guard exists)', async () => {
    // ValtDashboard sets loading=true during the API call which disables the button.
    // This means rapid double-clicks while loading won't trigger duplicate requests.
    let resolveFirst
    apiClient.profiles.sendTestnetCode.mockReturnValue(new Promise(r => { resolveFirst = r }))

    const wrapper = mountValtDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))

    // First click — starts the in-flight request
    sendButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Button is now disabled (loading=true) — second click is a no-op
    expect(sendButton.attributes('disabled')).toBeDefined()
    resolveFirst({ data: { success: true } })
    await flushPromises()
  })

  it('FIXED: Send Code is disabled for 60s after a successful send (resend cooldown)', async () => {
    vi.useFakeTimers()
    apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })

    const wrapper = mountValtDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    const sendButton = () => wrapper.findAll('button').find(b => b.text().includes('Send Code') || b.text().includes('Resend in'))

    await sendButton().trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Cancel returns to email form — cooldown should now block immediate resend
    const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancel')
    await cancelBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Button is back but disabled due to cooldown
    const btn = sendButton()
    expect(btn).toBeDefined()
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toMatch(/Resend in \d+s/)

    // After 60 seconds the cooldown clears
    vi.advanceTimersByTime(60_000)
    await wrapper.vm.$nextTick()
    expect(sendButton().text()).toBe('Send Code')
    expect(sendButton().attributes('disabled')).toBeUndefined()

    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// Finding #8 — ValtDashboard: signedIn state not persisted across refreshes
// ---------------------------------------------------------------------------

describe('Finding #8 — signedIn not restored on page reload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiClient.valt.dashboard.stats.mockResolvedValue({ data: null })
    localStorage.clear()
  })

  it('shows OTP form even when claim_available_at exists in localStorage', async () => {
    // Simulate a user who already verified: a future claim timestamp exists
    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400
    localStorage.setItem('claim_available_at', String(futureTimestamp))
    localStorage.setItem('valt_pending_email', 'returning@example.com')

    const wrapper = mountValtDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    // BUG: signedIn is still false — OTP form appears again after reload
    // TODO: onMounted should restore signedIn = true when claim data exists
    expect(wrapper.vm.signedIn).toBe(false)
    expect(wrapper.text()).toContain('Claim Your Daily Testnet Code')
  })
})

// ---------------------------------------------------------------------------
// Finding #9 — RESOLVED: valt_pending_email IS cleared after successful verification
// ---------------------------------------------------------------------------

describe('Finding #9 — RESOLVED: valt_pending_email is correctly cleaned up', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiClient.valt.dashboard.stats.mockResolvedValue({ data: null })
    localStorage.clear()
  })

  it('valt_pending_email is removed from localStorage after successful OTP verification', async () => {
    // ValtDashboard correctly calls localStorage.removeItem('valt_pending_email')
    // in multiple cleanup paths (lines 565, 646, 696).
    const claimAt = Math.floor(Date.now() / 1000) + 86400
    apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })
    apiClient.profiles.verifyTestnetCode.mockResolvedValue({
      data: {
        success: true,
        claim_available_at: claimAt,
        data: { rank: 1, points: 100, profile_balance: 10 }
      }
    })

    const wrapper = mountValtDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
    await sendButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    wrapper.vm.verificationCode = '123456'
    await wrapper.vm.$nextTick()

    const verifyButton = wrapper.findAll('button').find(b => b.text().includes('Verify'))
    await verifyButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // CORRECT: pending email is cleared after success
    expect(localStorage.getItem('valt_pending_email')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Finding #10 — VerifyTestnet: no email format validation
// ---------------------------------------------------------------------------

describe('Finding #10 — No client-side email validation in VerifyTestnet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('FIXED: empty email is rejected client-side — API is NOT called', async () => {
    apiClient.profiles.verifyTestnetCode.mockResolvedValue({ data: { user: { email: '' } } })

    const wrapper = mountVerify()
    // Leave email blank
    await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
    await wrapper.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 0))

    // FIXED: validation guard blocks the API call
    expect(apiClient.profiles.verifyTestnetCode).not.toHaveBeenCalled()
    expect(wrapper.find('.text-red-400').text()).toContain('valid email')
  })

  it('FIXED: non-email string is rejected client-side with a validation error', async () => {
    const wrapper = mountVerify()
    await wrapper.find('input[type="email"]').setValue('not-an-email')
    await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
    await wrapper.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    // FIXED: client-side validation error — API never called
    expect(apiClient.profiles.verifyTestnetCode).not.toHaveBeenCalled()
    expect(wrapper.find('.text-red-400').text()).toContain('valid email')
  })
})

// ---------------------------------------------------------------------------
// Finding #11 — ConnectedDashboard: generic localStorage key names
// ---------------------------------------------------------------------------

describe('Finding #11 — Generic localStorage key collision risk', () => {
  beforeEach(() => localStorage.clear())

  it('FIXED: no longer reads from bare "rank" key — uses namespaced "valt_rank" instead', async () => {
    // A foreign script sets the bare key — component must ignore it
    localStorage.setItem('rank', '42')

    const wrapper = mountConnected({ signedIn: true })
    await wrapper.vm.$nextTick()

    // Component does NOT pick up the bare key
    expect(wrapper.vm.globalRank).not.toBe(42)
  })

  it('FIXED: namespaced "valt_rank" key is immune to bare-key collisions from other scripts', async () => {
    localStorage.setItem('valt_rank', '7')
    const wrapper = mountConnected({ signedIn: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.globalRank).toBe(7)

    // Foreign script writes to bare key — component state must not change
    localStorage.setItem('rank', '1')
    const event = new StorageEvent('storage', { key: 'rank' })
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.globalRank).toBe(7)
  })
})

// ---------------------------------------------------------------------------
// Finding #12 — auth.js: signOut swallows errors silently
// ---------------------------------------------------------------------------

describe('Finding #12 — FIXED: authService.signOut() surfaces server errors', () => {
  it('clears localStorage even when the API call rejects', async () => {
    localStorage.setItem('breadcrumbs_token', 'my-token')
    localStorage.setItem('breadcrumbs_user', JSON.stringify({ email: 'test@example.com' }))

    apiClient.profiles.signOut.mockRejectedValueOnce(new Error('500 Internal Server Error'))

    // Error is now surfaced to the caller
    await expect(authService.signOut()).rejects.toThrow('500 Internal Server Error')

    // Storage is still cleared regardless of the server error
    expect(localStorage.getItem('breadcrumbs_token')).toBeNull()
    expect(localStorage.getItem('breadcrumbs_user')).toBeNull()
  })

  it('returns { success: true } when the API call succeeds', async () => {
    localStorage.setItem('breadcrumbs_token', 'my-token')
    apiClient.profiles.signOut.mockResolvedValueOnce({})

    const result = await authService.signOut()
    expect(result).toEqual({ success: true })
    expect(localStorage.getItem('breadcrumbs_token')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Finding #15 — Router: /connected-dashboard publicly accessible
// ---------------------------------------------------------------------------

describe('Finding #15 — ConnectedDashboard route has no auth guard', () => {
  it('renders without authentication (signedIn=false, no user data)', async () => {
    // The route is accessible and the component renders even without a signed-in user
    const wrapper = mountConnected({ signedIn: false, email: '' })

    expect(wrapper.exists()).toBe(true)
    // Shows placeholder data instead of redirecting
    expect(wrapper.text()).toContain('—')
  })
})
