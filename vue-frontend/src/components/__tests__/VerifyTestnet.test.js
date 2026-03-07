/**
 * Component tests for src/components/VerifyTestnet.vue
 *
 * Tests OTP verification UI, API interaction, localStorage persistence,
 * custom event dispatch, and routing after success/failure.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush.mockResolvedValue(undefined)
  }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
  RouterLink: { template: '<a><slot /></a>' },
  RouterView: { template: '<div />' }
}))

// Mock the api module — VerifyTestnet imports `api` (default export)
vi.mock('../../services/api.js', () => ({
  default: {
    profiles: {
      verifyTestnetCode: vi.fn()
    }
  }
}))

import VerifyTestnet from '../VerifyTestnet.vue'
import api from '../../services/api.js'

function mountVerify() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(VerifyTestnet, {
    global: { plugins: [pinia] }
  })
  return wrapper
}

describe('VerifyTestnet.vue', () => {
  beforeEach(() => {
    mockPush.mockClear()
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders the "Verify email" heading', () => {
      const wrapper = mountVerify()
      expect(wrapper.text()).toContain('Verify email')
    })

    it('renders an email input field', () => {
      const wrapper = mountVerify()
      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    })

    it('renders a 6-digit code text input', () => {
      const wrapper = mountVerify()
      const inputs = wrapper.findAll('input')
      const codeInput = inputs.find(i => i.attributes('maxlength') === '6')
      expect(codeInput).toBeDefined()
    })

    it('renders a Verify button', () => {
      const wrapper = mountVerify()
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Verify')
    })

    it('does not show an error message initially', () => {
      const wrapper = mountVerify()
      const errorEl = wrapper.find('.text-red-400')
      expect(errorEl.exists()).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // submit() — success path
  // ---------------------------------------------------------------------------

  describe('submit() — success', () => {
    it('calls api.profiles.verifyTestnetCode with email and token', async () => {
      const user = { email: 'test@example.com', id: '1' }
      api.profiles.verifyTestnetCode.mockResolvedValue({ data: { user } })

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
      await wrapper.find('button').trigger('click')

      expect(api.profiles.verifyTestnetCode).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456'
      })
    })

    it('stores the returned user in localStorage under "breadcrumbs_user"', async () => {
      const user = { email: 'test@example.com', id: '1' }
      api.profiles.verifyTestnetCode.mockResolvedValue({ data: { user } })

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(JSON.parse(localStorage.getItem('breadcrumbs_user'))).toEqual(user)
    })

    it('dispatches a "breadcrumbs-auth-change" CustomEvent on success', async () => {
      const user = { email: 'test@example.com', id: '1' }
      api.profiles.verifyTestnetCode.mockResolvedValue({ data: { user } })

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'breadcrumbs-auth-change' })
      )
    })

    it('dispatches the auth-change event with isAuthenticated: true', async () => {
      const user = { email: 'test@example.com', id: '1' }
      api.profiles.verifyTestnetCode.mockResolvedValue({ data: { user } })
      let capturedEvent = null
      window.dispatchEvent.mockImplementation((e) => { capturedEvent = e })

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(capturedEvent?.detail?.isAuthenticated).toBe(true)
      expect(capturedEvent?.detail?.user).toEqual(user)
    })

    it('sets a valt_next_claim_ key in localStorage after success', async () => {
      const user = { email: 'test@example.com', id: '1' }
      api.profiles.verifyTestnetCode.mockResolvedValue({ data: { user } })

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))

      const claimKey = localStorage.getItem('valt_next_claim_test@example.com')
      expect(claimKey).not.toBeNull()
    })

    it('navigates to ConnectedDashboard route on success', async () => {
      const user = { email: 'test@example.com', id: '1' }
      api.profiles.verifyTestnetCode.mockResolvedValue({ data: { user } })

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockPush).toHaveBeenCalledWith({ name: 'ConnectedDashboard' })
    })

    it('uses nextClaimAt from server response if provided', async () => {
      const futureDate = new Date(Date.now() + 48 * 3600 * 1000)
      const user = { email: 'test@example.com', id: '1', nextClaimAt: futureDate.toISOString() }
      api.profiles.verifyTestnetCode.mockResolvedValue({ data: { user } })

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))

      const stored = localStorage.getItem('valt_next_claim_test@example.com')
      expect(stored).toBe(futureDate.toISOString())
    })
  })

  // ---------------------------------------------------------------------------
  // submit() — error path
  // ---------------------------------------------------------------------------

  describe('submit() — errors', () => {
    it('shows a generic error when API rejects with a message', async () => {
      api.profiles.verifyTestnetCode.mockRejectedValue(new Error('Invalid token'))

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('000000')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.text-red-400').text()).toContain('Invalid token')
    })

    it('shows "No user returned from verification" when API returns no user', async () => {
      // res?.data?.user ?? res?.data ?? res — when res is null, all three are nullish
      // so user = null and the "No user returned" error is thrown.
      // { data: { user: null } } does NOT trigger it because res?.data is truthy.
      api.profiles.verifyTestnetCode.mockResolvedValue(null)

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('000000')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.text-red-400').text()).toContain('No user returned')
    })

    it('shows a server error message for HTML/non-JSON responses', async () => {
      const err = new Error('Bad Request')
      err.response = { status: 400, data: '<html>error</html>' }
      api.profiles.verifyTestnetCode.mockRejectedValue(err)

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('000000')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.text-red-400').text()).toContain('Server error (400)')
    })

    it('does NOT navigate on failure', async () => {
      api.profiles.verifyTestnetCode.mockRejectedValue(new Error('Fail'))

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('000000')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('shows "Verifying…" on the button while the request is in-flight', async () => {
      let resolve
      api.profiles.verifyTestnetCode.mockReturnValue(new Promise(r => { resolve = r }))

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('button').text()).toContain('Verifying')
      resolve({ data: { user: { email: 'test@example.com' } } })
    })
  })

  // ---------------------------------------------------------------------------
  // storageKeyFor() helper (tested via submit behavior)
  // ---------------------------------------------------------------------------

  describe('storageKeyFor() key generation', () => {
    it('normalises to lowercase for storage key', async () => {
      const user = { email: 'Test@EXAMPLE.COM', id: '1' }
      api.profiles.verifyTestnetCode.mockResolvedValue({ data: { user } })

      const wrapper = mountVerify()
      await wrapper.find('input[type="email"]').setValue('Test@EXAMPLE.COM')
      await wrapper.findAll('input').find(i => i.attributes('maxlength') === '6').setValue('123456')
      await wrapper.find('button').trigger('click')

      await new Promise(resolve => setTimeout(resolve, 0))

      // Key should be lowercased
      const key = localStorage.getItem('valt_next_claim_test@example.com')
      expect(key).not.toBeNull()
    })
  })
})
