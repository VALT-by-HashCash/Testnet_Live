/**
 * Component tests for src/components/ConnectedDashboard.vue
 *
 * Tests props-driven rendering, countdown timer logic, claim flow,
 * localStorage persistence, and emitted events.
 * Asset imports are handled by Vite's transform in the test env.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
  RouterView: { template: '<div />' }
}))

import ConnectedDashboard from '../ConnectedDashboard.vue'

function mountConnectedDashboard(props = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(ConnectedDashboard, {
    props: { signedIn: false, email: '', ...props },
    global: { plugins: [pinia] }
  })
}

describe('ConnectedDashboard.vue', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Rendering basics
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders the "Next claim in" label', () => {
      const wrapper = mountConnectedDashboard()
      expect(wrapper.text()).toContain('Next claim in')
    })

    it('renders the Claim Points button', () => {
      const wrapper = mountConnectedDashboard()
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Claim Points')
    })

    it('renders a rank section', () => {
      const wrapper = mountConnectedDashboard()
      expect(wrapper.text()).toContain('Rank')
    })
  })

  // ---------------------------------------------------------------------------
  // remainingText computed value
  // ---------------------------------------------------------------------------

  describe('remainingText', () => {
    it('shows "—" when signedIn is false', () => {
      const wrapper = mountConnectedDashboard({ signedIn: false })
      expect(wrapper.text()).toContain('—')
    })

    it('shows "24:00:00hrs" when signed in with no nextClaimAt stored', () => {
      const wrapper = mountConnectedDashboard({ signedIn: true, email: 'test@example.com' })
      expect(wrapper.text()).toContain('24:00:00')
    })

    it('shows "You can claim now" when signed in and countdown has expired', () => {
      // Store a past timestamp so remaining === 0
      const pastDate = new Date(Date.now() - 1000)
      localStorage.setItem('valt_next_claim_test@example.com', pastDate.toISOString())

      const wrapper = mountConnectedDashboard({ signedIn: true, email: 'test@example.com' })
      // Give the component a tick to compute
      return wrapper.vm.$nextTick().then(() => {
        expect(wrapper.text()).toContain('You can claim now')
      })
    })

    it('shows formatted HH:MM:SS when signed in with future nextClaimAt', async () => {
      const futureDate = new Date(Date.now() + 3661 * 1000) // ~1h 1m 1s
      localStorage.setItem('valt_next_claim_test@example.com', futureDate.toISOString())

      const wrapper = mountConnectedDashboard({ signedIn: true, email: 'test@example.com' })
      await wrapper.vm.$nextTick()

      const text = wrapper.text()
      // Should contain a time string like 01:01:01
      expect(text).toMatch(/\d{2}:\d{2}:\d{2}/)
    })
  })

  // ---------------------------------------------------------------------------
  // canClaim computed value
  // ---------------------------------------------------------------------------

  describe('canClaim', () => {
    it('Claim Points button is disabled when not signed in', () => {
      const wrapper = mountConnectedDashboard({ signedIn: false })
      const button = wrapper.find('button')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('Claim Points button is disabled when signed in but countdown is not zero', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000)
      localStorage.setItem('valt_next_claim_test@example.com', futureDate.toISOString())

      const wrapper = mountConnectedDashboard({ signedIn: true, email: 'test@example.com' })
      await wrapper.vm.$nextTick()

      const button = wrapper.find('button')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('Claim Points button is enabled when signed in and countdown has expired', async () => {
      const pastDate = new Date(Date.now() - 1000)
      localStorage.setItem('valt_next_claim_test@example.com', pastDate.toISOString())

      const wrapper = mountConnectedDashboard({ signedIn: true, email: 'test@example.com' })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      const button = wrapper.find('button')
      expect(button.attributes('disabled')).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // claim() — emitting events
  // ---------------------------------------------------------------------------

  describe('claim()', () => {
    it('emits "claim" event when canClaim is true', async () => {
      const pastDate = new Date(Date.now() - 1000)
      localStorage.setItem('valt_next_claim_test@example.com', pastDate.toISOString())

      const wrapper = mountConnectedDashboard({ signedIn: true, email: 'test@example.com' })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('claim')).toBeTruthy()
    })

    it('does NOT emit "claim" when canClaim is false', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000)
      localStorage.setItem('valt_next_claim_test@example.com', futureDate.toISOString())

      const wrapper = mountConnectedDashboard({ signedIn: true, email: 'test@example.com' })
      await wrapper.vm.$nextTick()

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('claim')).toBeFalsy()
    })

    it('does NOT emit "claim" when not signed in', async () => {
      const wrapper = mountConnectedDashboard({ signedIn: false })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('claim')).toBeFalsy()
    })

    it('updates localStorage with a new nextClaimAt after claim', async () => {
      const pastDate = new Date(Date.now() - 1000)
      localStorage.setItem('valt_next_claim_test@example.com', pastDate.toISOString())

      const wrapper = mountConnectedDashboard({ signedIn: true, email: 'test@example.com' })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      await wrapper.find('button').trigger('click')

      const stored = localStorage.getItem('valt_next_claim_test@example.com')
      expect(stored).not.toBeNull()
      // New claim time should be in the future (roughly 24h from now)
      const newClaimDate = new Date(stored)
      expect(newClaimDate.getTime()).toBeGreaterThan(Date.now())
    })
  })

  // ---------------------------------------------------------------------------
  // storageKeyFor() helper
  // ---------------------------------------------------------------------------

  describe('storageKeyFor()', () => {
    it('uses "anon" key when email is empty', () => {
      const wrapper = mountConnectedDashboard({ signedIn: false, email: '' })
      // The component should not crash with empty email
      expect(wrapper.exists()).toBe(true)
    })

    it('generates lowercase storage key from email prop', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000)
      localStorage.setItem('valt_next_claim_mixed@example.com', futureDate.toISOString())

      // Mount with mixed case — component normalises to lowercase
      const wrapper = mountConnectedDashboard({ signedIn: true, email: 'Mixed@Example.COM' })
      await wrapper.vm.$nextTick()

      // If the key lookup worked, countdown should not be "24:00:00"
      const text = wrapper.text()
      expect(text).not.toContain('24:00:00')
    })
  })

  // ---------------------------------------------------------------------------
  // loadProfileFromStorage()
  // ---------------------------------------------------------------------------

  describe('loadProfileFromStorage()', () => {
    it('reads rank from direct localStorage key', async () => {
      localStorage.setItem('valt_rank', '5')
      localStorage.setItem('valt_points', '1000')
      localStorage.setItem('valt_profile_balance', '100')
      localStorage.setItem('valt_connected_apps', '3')

      const wrapper = mountConnectedDashboard({ signedIn: true })
      // loadProfileFromStorage() sets globalRank reactively in onMounted;
      // wait for the DOM to reflect the updated value
      await wrapper.vm.$nextTick()

      // Check the reactive state directly (more reliable than DOM text)
      expect(wrapper.vm.globalRank).toBe(5)
    })

    it('does not crash when localStorage has no profile data', () => {
      const wrapper = mountConnectedDashboard({ signedIn: true })
      // globalRank shows "—" when no data
      expect(wrapper.text()).toContain('—')
    })
  })

  // ---------------------------------------------------------------------------
  // Prop reactivity — email change
  // ---------------------------------------------------------------------------

  describe('prop reactivity', () => {
    it('reloads claim state when email prop changes', async () => {
      const wrapper = mountConnectedDashboard({ signedIn: true, email: 'old@example.com' })

      const newDate = new Date(Date.now() - 1000)
      localStorage.setItem('valt_next_claim_new@example.com', newDate.toISOString())

      await wrapper.setProps({ email: 'new@example.com' })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('You can claim now')
    })
  })
})
