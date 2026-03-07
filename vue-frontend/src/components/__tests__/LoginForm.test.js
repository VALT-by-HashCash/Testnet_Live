/**
 * Component tests for src/components/LoginForm.vue
 *
 * Tests rendering, form interactions, sign-in flow, demo mode,
 * and error handling — without real API calls or routing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock vue-router so useRouter() returns a stub
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ params: {}, query: {}, meta: {} }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
  RouterLink: { template: '<a><slot /></a>' },
  RouterView: { template: '<div />' }
}))

// Mock the Pinia store
vi.mock('../../stores/valt.js', () => ({
  useValtStore: vi.fn()
}))

import LoginForm from '../LoginForm.vue'
import { useValtStore } from '../../stores/valt.js'

function createMockStore(overrides = {}) {
  return {
    signIn: vi.fn().mockResolvedValue({}),
    loadDashboardData: vi.fn().mockResolvedValue(undefined),
    user: null,
    isAuthenticated: false,
    ...overrides
  }
}

function mountLoginForm(storeOverrides = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const mockStore = createMockStore(storeOverrides)
  useValtStore.mockReturnValue(mockStore)

  return {
    wrapper: mount(LoginForm, { global: { plugins: [pinia] } }),
    mockStore
  }
}

describe('LoginForm.vue', () => {
  beforeEach(() => {
    mockPush.mockClear()
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders the VALT Dashboard heading', () => {
      const { wrapper } = mountLoginForm()
      expect(wrapper.find('h1').text()).toContain('VALT Dashboard')
    })

    it('renders an email input', () => {
      const { wrapper } = mountLoginForm()
      const emailInput = wrapper.find('input[type="email"]')
      expect(emailInput.exists()).toBe(true)
    })

    it('renders a password input', () => {
      const { wrapper } = mountLoginForm()
      const passwordInput = wrapper.find('input[type="password"]')
      expect(passwordInput.exists()).toBe(true)
    })

    it('renders a remember-me checkbox', () => {
      const { wrapper } = mountLoginForm()
      const checkbox = wrapper.find('input[type="checkbox"]')
      expect(checkbox.exists()).toBe(true)
    })

    it('renders a Sign In submit button', () => {
      const { wrapper } = mountLoginForm()
      const button = wrapper.find('button[type="submit"]')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Sign In')
    })

    it('renders a Try Demo Mode button', () => {
      const { wrapper } = mountLoginForm()
      const buttons = wrapper.findAll('button')
      const demoButton = buttons.find(b => b.text().includes('Demo Mode'))
      expect(demoButton).toBeDefined()
    })

    it('does not show error message initially', () => {
      const { wrapper } = mountLoginForm()
      // Error div only renders via v-if="error"
      expect(wrapper.text()).not.toContain('Sign in failed')
    })
  })

  // ---------------------------------------------------------------------------
  // Form interactions
  // ---------------------------------------------------------------------------

  describe('form interactions', () => {
    it('updates email reactive value when email input changes', async () => {
      const { wrapper } = mountLoginForm()
      const input = wrapper.find('input[type="email"]')
      await input.setValue('user@example.com')
      expect(input.element.value).toBe('user@example.com')
    })

    it('updates password reactive value when password input changes', async () => {
      const { wrapper } = mountLoginForm()
      const input = wrapper.find('input[type="password"]')
      await input.setValue('mypassword')
      expect(input.element.value).toBe('mypassword')
    })

    it('submit button is enabled when not loading', () => {
      const { wrapper } = mountLoginForm()
      const button = wrapper.find('button[type="submit"]')
      expect(button.attributes('disabled')).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // Sign-in flow
  // ---------------------------------------------------------------------------

  describe('handleSignIn()', () => {
    it('calls store.signIn with email and password on form submit', async () => {
      const { wrapper, mockStore } = mountLoginForm()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('input[type="password"]').setValue('secret')
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(mockStore.signIn).toHaveBeenCalledWith('user@example.com', 'secret')
    })

    it('navigates to /dashboard on successful sign-in', async () => {
      const { wrapper } = mountLoginForm()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('input[type="password"]').setValue('secret')
      await wrapper.find('form').trigger('submit')

      // Wait for async signIn to resolve
      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('stores rememberMe in localStorage when checkbox is checked', async () => {
      const { wrapper } = mountLoginForm()

      await wrapper.find('input[type="checkbox"]').setValue(true)
      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('input[type="password"]').setValue('secret')
      await wrapper.find('form').trigger('submit')

      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(localStorage.getItem('rememberMe')).toBe('true')
    })

    it('displays an error message when sign-in fails', async () => {
      const { wrapper } = mountLoginForm({
        signIn: vi.fn().mockRejectedValue(new Error('Invalid credentials'))
      })

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('input[type="password"]').setValue('wrong')
      await wrapper.find('form').trigger('submit')

      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Invalid credentials')
    })

    it('shows fallback error when rejection has no message', async () => {
      const { wrapper } = mountLoginForm({
        signIn: vi.fn().mockRejectedValue({})
      })

      await wrapper.find('form').trigger('submit')

      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Sign in failed')
    })

    it('does not call store.signIn again while already loading', async () => {
      let resolveSignIn
      const slowSignIn = vi.fn().mockReturnValue(
        new Promise(res => { resolveSignIn = res })
      )
      const { wrapper } = mountLoginForm({ signIn: slowSignIn })

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('input[type="password"]').setValue('pass')

      // Submit twice rapidly
      await wrapper.find('form').trigger('submit')
      await wrapper.find('form').trigger('submit')

      resolveSignIn({})
      await new Promise(resolve => setTimeout(resolve, 0))

      // Should only have been called once
      expect(slowSignIn).toHaveBeenCalledTimes(1)
    })
  })

  // ---------------------------------------------------------------------------
  // Demo mode
  // ---------------------------------------------------------------------------

  describe('signInAsDemo()', () => {
    it('sets demo user on the store', async () => {
      const { wrapper, mockStore } = mountLoginForm()

      const demoButton = wrapper.findAll('button').find(b => b.text().includes('Demo'))
      await demoButton.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(mockStore.user).toEqual({
        email: 'demo@breadcrumbs.com',
        id: 'demo-user',
        username: 'Demo User'
      })
      expect(mockStore.isAuthenticated).toBe(true)
    })

    it('calls store.loadDashboardData in demo mode', async () => {
      const { wrapper, mockStore } = mountLoginForm()

      const demoButton = wrapper.findAll('button').find(b => b.text().includes('Demo'))
      await demoButton.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockStore.loadDashboardData).toHaveBeenCalled()
    })

    it('navigates to /dashboard after demo mode loads', async () => {
      const { wrapper } = mountLoginForm()

      const demoButton = wrapper.findAll('button').find(b => b.text().includes('Demo'))
      await demoButton.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('shows error when demo mode fails', async () => {
      const { wrapper } = mountLoginForm({
        loadDashboardData: vi.fn().mockRejectedValue(new Error('Load failed'))
      })

      const demoButton = wrapper.findAll('button').find(b => b.text().includes('Demo'))
      await demoButton.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Demo mode failed to load')
    })
  })
})
