/**
 * Workflow test: Claim Reward Flow
 *
 * Simulates a signed-in user claiming their daily reward through
 * ConnectedDashboard. Tests the full lifecycle:
 * - canClaim state based on timestamp
 * - Clicking "Claim Points"
 * - Event propagation to parent (ValtDashboard)
 * - localStorage persistence of next claim timestamp
 * - Countdown reset after claiming
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
      sendTestnetCode: vi.fn().mockResolvedValue({ data: { success: true } }),
      verifyTestnetCode: vi.fn(),
      testnetReward: vi.fn().mockResolvedValue({ data: { success: true } })
    },
    valt: {
      dashboard: {
        stats: vi.fn().mockResolvedValue({ data: null })
      }
    }
  }
}))

import ConnectedDashboard from '../../components/ConnectedDashboard.vue'
import ValtDashboard from '../../components/ValtDashboard.vue'

// Helper: set a past timestamp so canClaim is immediately true
function setExpiredClaim(email = '') {
  const key = `valt_next_claim_${(email || 'anon').toLowerCase()}`
  const past = new Date(Date.now() - 1000)
  localStorage.setItem(key, past.toISOString())
  return key
}

// Helper: set a future timestamp so canClaim is false
function setFutureClaim(email = '', hoursFromNow = 24) {
  const key = `valt_next_claim_${(email || 'anon').toLowerCase()}`
  const future = new Date(Date.now() + hoursFromNow * 3600 * 1000)
  localStorage.setItem(key, future.toISOString())
  return key
}

function mountConnected(props = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(ConnectedDashboard, {
    props: { signedIn: false, email: '', ...props },
    global: { plugins: [pinia] }
  })
}

describe('Workflow: Claim Reward Flow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---------------------------------------------------------------------------
  // Pre-conditions
  // ---------------------------------------------------------------------------

  it('Pre-condition: Claim button is disabled when not signed in', () => {
    const wrapper = mountConnected({ signedIn: false })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('Pre-condition: Claim button is disabled when signed in but cooldown active', async () => {
    setFutureClaim('test@example.com', 12)
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('Pre-condition: Claim button is enabled when cooldown has expired', async () => {
    setExpiredClaim('test@example.com')
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })

  // ---------------------------------------------------------------------------
  // Claim action
  // ---------------------------------------------------------------------------

  it('Claim: emits "claim" event when button is clicked', async () => {
    setExpiredClaim('test@example.com')
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('claim')).toBeTruthy()
  })

  it('Claim: saves a new next-claim timestamp ~24h in the future', async () => {
    setExpiredClaim('test@example.com')
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const before = Date.now()
    await wrapper.find('button').trigger('click')

    const storedKey = `valt_next_claim_test@example.com`
    const storedDate = new Date(localStorage.getItem(storedKey))
    const expectedMin = before + 23 * 3600 * 1000
    const expectedMax = before + 25 * 3600 * 1000

    expect(storedDate.getTime()).toBeGreaterThan(expectedMin)
    expect(storedDate.getTime()).toBeLessThan(expectedMax)
  })

  it('Claim: also persists claim_available_at as unix timestamp', async () => {
    setExpiredClaim('test@example.com')
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await wrapper.find('button').trigger('click')

    const claimAt = Number(localStorage.getItem('claim_available_at'))
    expect(claimAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('Claim: countdown restarts after claiming (remaining > 0)', async () => {
    setExpiredClaim('test@example.com')
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    // After claiming, remaining should be ~86400
    expect(wrapper.vm.remaining).toBeGreaterThan(0)
  })

  it('Claim: button becomes disabled again after claiming', async () => {
    setExpiredClaim('test@example.com')
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  // ---------------------------------------------------------------------------
  // Countdown display
  // ---------------------------------------------------------------------------

  it('Display: shows "You can claim now" when countdown expires', async () => {
    setExpiredClaim('test@example.com')
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('You can claim now')
  })

  it('Display: shows formatted countdown when time remaining > 0', async () => {
    setFutureClaim('test@example.com', 2) // 2 hours
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toMatch(/\d{2}:\d{2}:\d{2}/)
  })

  it('Display: countdown ticks down each second', async () => {
    setFutureClaim('test@example.com', 1) // 1 hour
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })
    await wrapper.vm.$nextTick()

    const initialRemaining = wrapper.vm.remaining

    // Advance 1 second
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.remaining).toBeLessThan(initialRemaining)
  })

  // ---------------------------------------------------------------------------
  // Profile data loading
  // ---------------------------------------------------------------------------

  it('Profile: loads rank from localStorage on mount', () => {
    localStorage.setItem('valt_rank', '7')
    localStorage.setItem('valt_points', '2500')
    localStorage.setItem('valt_profile_balance', '250')

    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })

    expect(wrapper.vm.globalRank).toBe(7)
    expect(wrapper.vm.totalPoints).toBe(2500)
    expect(wrapper.vm.balance).toBe(250)
  })

  it('Profile: updates when storage events fire with new rank data', async () => {
    const wrapper = mountConnected({ signedIn: true, email: 'test@example.com' })

    // Simulate another tab writing to storage
    localStorage.setItem('valt_rank', '3')
    const event = new StorageEvent('storage', { key: 'valt_rank' })
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.globalRank).toBe(3)
  })

  // ---------------------------------------------------------------------------
  // ValtDashboard integration: handleClaimFromConnected
  // ---------------------------------------------------------------------------

  describe('Integration with ValtDashboard', () => {
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

    it('handleClaimFromConnected: persists claim timestamp to localStorage', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      const futureClaimAt = Math.floor(Date.now() / 1000) + 86400
      await wrapper.vm.handleClaimFromConnected({ email: 'user@example.com', claimAt: futureClaimAt })
      await flushPromises()

      const stored = Number(localStorage.getItem('claim_available_at'))
      expect(stored).toBeGreaterThanOrEqual(futureClaimAt)
    })

    it('handleClaimFromConnected: sets countdown from the claimAt value', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      const claimAt = Math.floor(Date.now() / 1000) + 3600
      await wrapper.vm.handleClaimFromConnected({ email: 'user@example.com', claimAt })
      await flushPromises()

      expect(wrapper.vm.countdown).toBeGreaterThan(0)
    })

    it('handleClaimFromConnected: sets rewardClaimed to true', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      await wrapper.vm.handleClaimFromConnected({ email: 'user@example.com', claimAt: Date.now() / 1000 + 100 })
      await flushPromises()

      expect(wrapper.vm.rewardClaimed).toBe(true)
    })
  })
})
