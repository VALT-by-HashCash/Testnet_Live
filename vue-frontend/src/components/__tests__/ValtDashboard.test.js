/**
 * Component tests for src/components/ValtDashboard.vue
 *
 * Tests initial loading state, OTP claim flow UI, toast notifications,
 * cancel verification, sign-in state display, and timer lifecycle.
 * Child components (ConnectedDashboard) are stubbed to isolate ValtDashboard.
 * API calls are mocked — no real HTTP calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
  RouterView: { template: '<div />' }
}))

// Mock the api module
vi.mock('../../services/api.js', () => ({
  default: {
    profiles: {
      sendTestnetCode: vi.fn(),
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

import ValtDashboard from '../ValtDashboard.vue'
import apiClient from '../../services/api.js'

// Stub ConnectedDashboard to avoid its icon imports and timer logic
const ConnectedDashboardStub = {
  name: 'ConnectedDashboard',
  template: '<div data-testid="connected-dashboard-stub" />',
  props: ['signedIn', 'email'],
  emits: ['signed-in', 'claim']
}

function mountValtDashboard(props = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(ValtDashboard, {
    props,
    global: {
      plugins: [pinia],
      stubs: { ConnectedDashboard: ConnectedDashboardStub }
    }
  })
}

describe('ValtDashboard.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    // Default API response — no error
    apiClient.valt.dashboard.stats.mockResolvedValue({ data: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  describe('loading state', () => {
    it('shows a loading spinner before data is ready', () => {
      const wrapper = mountValtDashboard()
      // Before promises resolve, isLoading is true
      const spinner = wrapper.find('.animate-spin')
      expect(spinner.exists()).toBe(true)
    })

    it('hides the spinner after loadDashboardData resolves', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()
      const spinner = wrapper.find('.animate-spin')
      expect(spinner.exists()).toBe(false)
    })

    it('hides spinner after 5-second timeout even if load fails', async () => {
      apiClient.valt.dashboard.stats.mockRejectedValue(new Error('timeout'))
      const wrapper = mountValtDashboard()

      // Advance past the 5000ms safety timeout
      vi.advanceTimersByTime(5100)
      await flushPromises()
      await wrapper.vm.$nextTick()

      const spinner = wrapper.find('.animate-spin')
      expect(spinner.exists()).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Main content after loading
  // ---------------------------------------------------------------------------

  describe('main content', () => {
    it('renders the VALT logo navigation bar after loading', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      const nav = wrapper.find('nav')
      expect(nav.exists()).toBe(true)
    })

    it('shows "Sign In" prompt for balance when not signed in', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Sign In')
    })

    it('shows balance value when signed in', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Simulate sign-in by mutating the component's reactive state
      wrapper.vm.signedIn = true
      wrapper.vm.balance = 42
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('VALT Points')
      expect(wrapper.text()).toContain('42')
    })

    it('shows the "Claim Your Daily Testnet Code" section by default', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Claim Your Daily Testnet Code')
    })

    it('shows the email input field in the claim section', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      const emailInput = wrapper.find('input[type="email"]')
      expect(emailInput.exists()).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // claimReward() — production/test mode (MODE !== 'development')
  // ---------------------------------------------------------------------------

  describe('claimReward()', () => {
    it('calls api.profiles.sendTestnetCode with the entered email', async () => {
      apiClient.profiles.sendTestnetCode.mockResolvedValue({
        data: { success: true }
      })

      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
      await sendButton.trigger('click')
      await flushPromises()

      expect(apiClient.profiles.sendTestnetCode).toHaveBeenCalledWith({
        email: 'test@example.com'
      })
    })

    it('shows the code input section after a successful send', async () => {
      apiClient.profiles.sendTestnetCode.mockResolvedValue({
        data: { success: true }
      })

      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
      await sendButton.trigger('click')
      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Enter Verification Code')
    })

    it('does not call API when email is empty', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
      await sendButton.trigger('click')
      await flushPromises()

      expect(apiClient.profiles.sendTestnetCode).not.toHaveBeenCalled()
    })

    it('shows error toast when API returns success: false', async () => {
      apiClient.profiles.sendTestnetCode.mockResolvedValue({
        data: { success: false, error: 'Email not found' }
      })

      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      await wrapper.find('input[type="email"]').setValue('unknown@example.com')
      const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
      await sendButton.trigger('click')
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Toast should appear
      expect(wrapper.text()).toContain('Email not found')
    })
  })

  // ---------------------------------------------------------------------------
  // cancelVerification()
  // ---------------------------------------------------------------------------

  describe('cancelVerification()', () => {
    it('hides the code input and returns to the email step', async () => {
      apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })

      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
      await sendButton.trigger('click')
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Now in code-input mode — cancel
      const cancelButton = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      await cancelButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Claim Your Daily Testnet Code')
      expect(wrapper.text()).not.toContain('Enter Verification Code')
    })

    it('clears valt_pending_email from localStorage on cancel', async () => {
      apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })

      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
      await sendButton.trigger('click')
      await flushPromises()
      await wrapper.vm.$nextTick()

      const cancelButton = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      await cancelButton.trigger('click')

      expect(localStorage.getItem('valt_pending_email')).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // Countdown display
  // ---------------------------------------------------------------------------

  describe('countdown display', () => {
    it('shows countdown timer when rewardClaimed is true', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Simulate reward claimed state
      wrapper.vm.rewardClaimed = true
      wrapper.vm.countdown = 3600
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Next Reward Available In')
    })

    it('restores countdown from localStorage on mount', async () => {
      // Set a future claim timestamp
      const futureUnix = Math.floor(Date.now() / 1000) + 7200 // 2 hours
      localStorage.setItem('claim_available_at', String(futureUnix))

      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      // countdown should be approximately 7200
      expect(wrapper.vm.countdown).toBeGreaterThan(0)
    })
  })

  // ---------------------------------------------------------------------------
  // showToast()
  // ---------------------------------------------------------------------------

  describe('showToast()', () => {
    it('displays a success toast message', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      wrapper.vm.showToast('success', 'Done', 'Operation complete')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Done')
      expect(wrapper.text()).toContain('Operation complete')
    })

    it('auto-hides the toast after 4 seconds', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      wrapper.vm.showToast('info', 'Info', 'Something happened')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.toast.show).toBe(true)

      vi.advanceTimersByTime(4001)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.toast.show).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // handleSignedIn() — event from ConnectedDashboard
  // ---------------------------------------------------------------------------

  describe('handleSignedIn()', () => {
    it('updates signedIn, username, balance, and currentEmail from payload', async () => {
      const wrapper = mountValtDashboard()
      await flushPromises()
      await wrapper.vm.$nextTick()

      wrapper.vm.handleSignedIn({
        username: 'DataUser',
        balance: 999,
        email: 'data@example.com'
      })

      expect(wrapper.vm.signedIn).toBe(true)
      expect(wrapper.vm.username).toBe('DataUser')
      expect(wrapper.vm.balance).toBe(999)
      expect(wrapper.vm.currentEmail).toBe('data@example.com')
    })
  })

  // ---------------------------------------------------------------------------
  // Timer cleanup
  // ---------------------------------------------------------------------------

  describe('timer lifecycle', () => {
    it('clears timers on unmount (no interval leak)', async () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
      const wrapper = mountValtDashboard()
      await flushPromises()

      wrapper.unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })
})
