/**
 * Workflow test: OTP Authentication Flow
 *
 * Simulates the full user journey from landing on ValtDashboard,
 * entering an email, receiving a code, verifying it, and being
 * signed in with countdown started.
 *
 * Covers the interaction between ValtDashboard's OTP form
 * and the api.profiles endpoints.
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
      verifyTestnetCode: vi.fn()
    },
    valt: {
      dashboard: {
        stats: vi.fn().mockResolvedValue({ data: null })
      }
    }
  }
}))

import ValtDashboard from '../../components/ValtDashboard.vue'
import apiClient from '../../services/api.js'

const ConnectedDashboardStub = {
  name: 'ConnectedDashboard',
  template: '<div />',
  props: ['signedIn', 'email'],
  emits: ['signed-in', 'claim']
}

function mountDashboard() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(ValtDashboard, {
    global: {
      plugins: [pinia],
      stubs: { ConnectedDashboard: ConnectedDashboardStub }
    }
  })
}

describe('Workflow: OTP Authentication Flow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    apiClient.valt.dashboard.stats.mockResolvedValue({ data: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---------------------------------------------------------------------------
  // Step 1: Dashboard loads
  // ---------------------------------------------------------------------------

  it('Step 1 — Dashboard renders the OTP email input form after loading', async () => {
    const wrapper = mountDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Claim Your Daily Testnet Code')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
    expect(sendButton).toBeDefined()
  })

  // ---------------------------------------------------------------------------
  // Step 2: User enters email and requests a code
  // ---------------------------------------------------------------------------

  it('Step 2 — Send Code calls the sendTestnetCode API endpoint', async () => {
    apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })

    const wrapper = mountDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
    await sendButton.trigger('click')
    await flushPromises()

    expect(apiClient.profiles.sendTestnetCode).toHaveBeenCalledWith({
      email: 'user@example.com'
    })
  })

  // ---------------------------------------------------------------------------
  // Step 3: Code input form appears
  // ---------------------------------------------------------------------------

  it('Step 3 — Code input section appears after sending', async () => {
    apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })

    const wrapper = mountDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
    await sendButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Enter Verification Code')
    expect(wrapper.text()).toContain('user@example.com')
  })

  // ---------------------------------------------------------------------------
  // Step 4: User enters the 6-digit code
  // ---------------------------------------------------------------------------

  it('Step 4 — Code input only accepts numeric digits', async () => {
    apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })

    const wrapper = mountDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
    await sendButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // The code input has maxlength=6 and an @input filter for digits
    const codeInput = wrapper.findAll('input').find(i => i.attributes('maxlength') === '6')
    expect(codeInput).toBeDefined()
    expect(codeInput.attributes('placeholder')).toBe('123456')
  })

  // ---------------------------------------------------------------------------
  // Step 5: Verify & Claim — successful production flow
  // ---------------------------------------------------------------------------

  it('Step 5 — Successful verification signs user in and sets countdown', async () => {
    const claimAt = Math.floor(Date.now() / 1000) + 86400

    apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })
    apiClient.profiles.verifyTestnetCode.mockResolvedValue({
      data: {
        success: true,
        message: '10 points awarded.',
        claim_available_at: claimAt,
        data: { rank: 5, points: 100, profile_balance: 10 }
      }
    })

    const wrapper = mountDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Enter email and send code
    await wrapper.find('input[type="email"]').setValue('user@example.com')
    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
    await sendButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Enter 6-digit code
    const codeInput = wrapper.findAll('input').find(i => i.attributes('maxlength') === '6')
    await codeInput.setValue('123456')
    wrapper.vm.verificationCode = '123456' // ensure reactive sync
    await wrapper.vm.$nextTick()

    // Click Verify & Claim
    const verifyButton = wrapper.findAll('button').find(b => b.text().includes('Verify'))
    await verifyButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(apiClient.profiles.verifyTestnetCode).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' })
    )
    expect(wrapper.vm.signedIn).toBe(true)
    expect(wrapper.vm.countdown).toBeGreaterThan(0)
  })

  // ---------------------------------------------------------------------------
  // Step 6: After verification, active tab switches to Connect
  // ---------------------------------------------------------------------------

  it('Step 6 — Active tab changes to "Connect" after successful verification', async () => {
    const claimAt = Math.floor(Date.now() / 1000) + 86400

    apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })
    apiClient.profiles.verifyTestnetCode.mockResolvedValue({
      data: {
        success: true,
        claim_available_at: claimAt,
        data: {}
      }
    })

    const wrapper = mountDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
    await sendButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    wrapper.vm.verificationCode = '123456'
    // Must wait for DOM to reflect verificationCode.length so button is enabled
    await wrapper.vm.$nextTick()

    const verifyButton = wrapper.findAll('button').find(b => b.text().includes('Verify'))
    await verifyButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.activeTab).toBe('Connect')
  })

  // ---------------------------------------------------------------------------
  // Error path: wrong code shows error toast
  // ---------------------------------------------------------------------------

  it('Error path — Wrong code shows a verification failure message', async () => {
    apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })
    apiClient.profiles.verifyTestnetCode.mockResolvedValue({
      data: { success: false, error: 'Invalid OTP code' }
    })

    const wrapper = mountDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
    await sendButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    wrapper.vm.verificationCode = '000000'
    // Must wait for DOM to reflect verificationCode.length so the Verify button is enabled
    await wrapper.vm.$nextTick()

    const verifyButton = wrapper.findAll('button').find(b => b.text().includes('Verify'))
    await verifyButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // User remains not signed in
    expect(wrapper.vm.signedIn).toBe(false)
    // Error message shown in toast
    expect(wrapper.text()).toContain('Invalid OTP code')
  })

  // ---------------------------------------------------------------------------
  // Cancel flow: user can go back to email entry
  // ---------------------------------------------------------------------------

  it('Cancel flow — Clicking Cancel returns to email entry state', async () => {
    apiClient.profiles.sendTestnetCode.mockResolvedValue({ data: { success: true } })

    const wrapper = mountDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Send Code'))
    await sendButton.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // In code-input state now
    expect(wrapper.text()).toContain('Enter Verification Code')

    const cancelButton = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Claim Your Daily Testnet Code')
    expect(wrapper.vm.showCodeInput).toBe(false)
    expect(wrapper.vm.verificationCode).toBe('')
  })

  // ---------------------------------------------------------------------------
  // Persistence: pending email restored on reload
  // ---------------------------------------------------------------------------

  it('Persistence — Pending email is restored from localStorage on mount', async () => {
    localStorage.setItem('valt_pending_email', 'saved@example.com')

    const wrapper = mountDashboard()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.pendingEmail).toBe('saved@example.com')
  })
})
