/**
 * Unit tests for src/stores/valt.js
 *
 * Tests state, getters, and every action in the Pinia store.
 * Auth and dashboard services are mocked — no real HTTP calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// vi.mock is hoisted — mock dependencies before the store is imported.
vi.mock('../../services/auth.js', () => ({
  authService: {
    initialize: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    setAuthData: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn()
  }
}))

// Dashboard service stub is minimal; mock the full expected surface
vi.mock('../../services/dashboard.js', () => ({
  dashboardService: {
    getUserStats: vi.fn().mockResolvedValue({}),
    getPosts: vi.fn().mockResolvedValue([]),
    getApps: vi.fn().mockResolvedValue([]),
    getNotifications: vi.fn().mockResolvedValue([]),
    getProfileDetails: vi.fn().mockResolvedValue(null),
    calculateUserStats: vi.fn().mockReturnValue({
      dailyPoints: 100,
      totalPoints: 5000,
      dailyActions: 10,
      totalActions: 500,
      connectedApps: 5,
      globalRank: 10,
      balance: 500
    }),
    getRewards: vi.fn().mockReturnValue([]),
    getTrafficStats: vi.fn().mockReturnValue({
      bandwidth: '100 MB/s',
      connections: 100,
      dataTransferred: '1 GB',
      quality: 'Good'
    })
  }
}))

import { useValtStore } from '../valt.js'
import { authService } from '../../services/auth.js'
import { dashboardService } from '../../services/dashboard.js'

describe('useValtStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------

  describe('initial state', () => {
    it('has correct authentication defaults', () => {
      const store = useValtStore()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('has correct UI state defaults', () => {
      const store = useValtStore()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.activeTab).toBe('Home')
    })

    it('has correct userStats defaults (all zeros — no mock data)', () => {
      const store = useValtStore()
      expect(store.userStats).toMatchObject({
        dailyPoints: 0,
        totalPoints: 0,
        dailyActions: 0,
        totalActions: 0,
        connectedApps: 0,
        globalRank: 0,
        balance: 0
      })
    })

    it('starts with empty rewards (populated from API after auth)', () => {
      const store = useValtStore()
      expect(store.rewards).toHaveLength(0)
    })

    it('starts with empty leaderboard (populated from API after auth)', () => {
      const store = useValtStore()
      expect(store.leaderboard).toHaveLength(0)
    })

    it('has correct reward/countdown defaults', () => {
      const store = useValtStore()
      expect(store.rewardClaimed).toBe(false)
      expect(store.countdown).toBe(0)
      expect(store.goalProgress).toBe(0)
      expect(store.valtKey).toBe('')
    })

    it('has correct default settings', () => {
      const store = useValtStore()
      expect(store.settings).toMatchObject({
        username: 'Valt Guest',
        notifications: true,
        theme: 'dark'
      })
    })

    it('has null trafficStats by default (populated from API after auth)', () => {
      const store = useValtStore()
      expect(store.trafficStats).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // Getter: timeLeft
  // ---------------------------------------------------------------------------

  describe('timeLeft getter', () => {
    it('returns zeros when countdown is 0', () => {
      const store = useValtStore()
      expect(store.timeLeft).toEqual({ hours: 0, minutes: 0, seconds: 0 })
    })

    it('correctly decomposes 1 hour 1 minute 1 second', () => {
      const store = useValtStore()
      store.countdown = 3661
      expect(store.timeLeft).toEqual({ hours: 1, minutes: 1, seconds: 1 })
    })

    it('correctly decomposes 24 hours (86400 seconds)', () => {
      const store = useValtStore()
      store.countdown = 86400
      expect(store.timeLeft).toEqual({ hours: 24, minutes: 0, seconds: 0 })
    })

    it('correctly decomposes 90 seconds', () => {
      const store = useValtStore()
      store.countdown = 90
      expect(store.timeLeft).toEqual({ hours: 0, minutes: 1, seconds: 30 })
    })

    it('correctly decomposes 59 seconds', () => {
      const store = useValtStore()
      store.countdown = 59
      expect(store.timeLeft).toEqual({ hours: 0, minutes: 0, seconds: 59 })
    })
  })

  // ---------------------------------------------------------------------------
  // Action: initialize()
  // ---------------------------------------------------------------------------

  describe('initialize()', () => {
    it('sets loading to false when done', async () => {
      authService.isAuthenticated.mockReturnValue(false)
      const store = useValtStore()
      await store.initialize()
      expect(store.loading).toBe(false)
    })

    it('does not set auth when not authenticated', async () => {
      authService.isAuthenticated.mockReturnValue(false)
      const store = useValtStore()
      await store.initialize()
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
    })

    it('sets isAuthenticated and user when auth service says authenticated', async () => {
      const user = { email: 'test@example.com', id: '1' }
      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue(user)

      const store = useValtStore()
      await store.initialize()

      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(user)
    })

    it('sets error message and loading=false when an exception is thrown', async () => {
      authService.isAuthenticated.mockImplementation(() => {
        throw new Error('Storage corrupted')
      })
      const store = useValtStore()
      await store.initialize()

      expect(store.error).toBe('Storage corrupted')
      expect(store.loading).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Action: signIn(email, password)
  // ---------------------------------------------------------------------------

  describe('signIn(email, password)', () => {
    it('sets isAuthenticated and user on success', async () => {
      const user = { email: 'test@example.com', id: '1' }
      authService.signIn.mockResolvedValue({ token: 'abc123', user })

      const store = useValtStore()
      await store.signIn('test@example.com', 'password')

      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(user)
    })

    it('calls authService.setAuthData with token and user', async () => {
      const user = { email: 'test@example.com', id: '1' }
      authService.signIn.mockResolvedValue({ token: 'abc123', user })

      const store = useValtStore()
      await store.signIn('test@example.com', 'password')

      expect(authService.setAuthData).toHaveBeenCalledWith('abc123', user)
    })

    it('sets loading to false after success', async () => {
      authService.signIn.mockResolvedValue({ token: 'abc123', user: { email: 'test@example.com' } })
      const store = useValtStore()
      await store.signIn('test@example.com', 'password')
      expect(store.loading).toBe(false)
    })

    it('sets error and re-throws on failure', async () => {
      authService.signIn.mockRejectedValue(new Error('Invalid credentials'))
      const store = useValtStore()

      await expect(
        store.signIn('test@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials')

      expect(store.error).toBe('Invalid credentials')
      expect(store.loading).toBe(false)
    })

    it('does not set isAuthenticated when token is missing from result', async () => {
      authService.signIn.mockResolvedValue({ token: null, user: null })
      const store = useValtStore()
      await store.signIn('test@example.com', 'password')
      expect(store.isAuthenticated).toBe(false)
    })

    it('returns the signIn result', async () => {
      const expected = { token: 'abc123', user: { email: 'test@example.com' } }
      authService.signIn.mockResolvedValue(expected)
      const store = useValtStore()
      const result = await store.signIn('test@example.com', 'password')
      expect(result).toEqual(expected)
    })
  })

  // ---------------------------------------------------------------------------
  // Action: signOut()
  // ---------------------------------------------------------------------------

  describe('signOut()', () => {
    it('resets auth state after sign out', async () => {
      authService.signOut.mockResolvedValue({ success: true })
      const store = useValtStore()
      store.user = { email: 'test@example.com' }
      store.isAuthenticated = true

      await store.signOut()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('still resets state even when authService.signOut throws', async () => {
      authService.signOut.mockRejectedValue(new Error('Network error'))
      const store = useValtStore()
      store.user = { email: 'test@example.com' }
      store.isAuthenticated = true

      await store.signOut()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Action: resetStore()
  // ---------------------------------------------------------------------------

  describe('resetStore()', () => {
    it('nullifies user and auth', () => {
      const store = useValtStore()
      store.user = { email: 'test@example.com' }
      store.isAuthenticated = true
      store.resetStore()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('clears posts, apps, notifications, profileDetails', () => {
      const store = useValtStore()
      store.posts = [{ id: 1 }]
      store.apps = [{ id: 1 }]
      store.notifications = [{ id: 1 }]
      store.profileDetails = { id: 1 }
      store.resetStore()
      expect(store.posts).toEqual([])
      expect(store.apps).toEqual([])
      expect(store.notifications).toEqual([])
      expect(store.profileDetails).toBeNull()
    })

    it('zeroes out userStats', () => {
      const store = useValtStore()
      store.resetStore()
      expect(store.userStats).toMatchObject({
        dailyPoints: 0,
        totalPoints: 0,
        dailyActions: 0,
        totalActions: 0,
        connectedApps: 0,
        globalRank: 0,
        balance: 0
      })
    })

    it('clears error state', () => {
      const store = useValtStore()
      store.error = 'some error'
      store.resetStore()
      expect(store.error).toBeNull()
    })

    it('clears rewards', () => {
      const store = useValtStore()
      store.resetStore()
      expect(store.rewards).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // Action: claimReward(valtKey)
  // ---------------------------------------------------------------------------

  describe('claimReward(valtKey)', () => {
    it('returns true and sets rewardClaimed with a valid key', () => {
      const store = useValtStore()
      const result = store.claimReward('valid-key')
      expect(result).toBe(true)
      expect(store.rewardClaimed).toBe(true)
    })

    it('sets countdown to 86400 (24 hours)', () => {
      const store = useValtStore()
      store.claimReward('key')
      expect(store.countdown).toBe(86400)
    })

    it('adds 100 points to dailyPoints and totalPoints', () => {
      const store = useValtStore()
      const prevDaily = store.userStats.dailyPoints
      const prevTotal = store.userStats.totalPoints
      store.claimReward('key')
      expect(store.userStats.dailyPoints).toBe(prevDaily + 100)
      expect(store.userStats.totalPoints).toBe(prevTotal + 100)
    })

    it('adds 5 to dailyActions and totalActions', () => {
      const store = useValtStore()
      const prevDailyActions = store.userStats.dailyActions
      const prevTotalActions = store.userStats.totalActions
      store.claimReward('key')
      expect(store.userStats.dailyActions).toBe(prevDailyActions + 5)
      expect(store.userStats.totalActions).toBe(prevTotalActions + 5)
    })

    it('recalculates balance as Math.floor(totalPoints / 10)', () => {
      const store = useValtStore()
      store.userStats.totalPoints = 1000
      store.claimReward('key')
      expect(store.userStats.balance).toBe(Math.floor(1100 / 10))
    })

    it('returns false for empty string key', () => {
      const store = useValtStore()
      expect(store.claimReward('')).toBe(false)
      expect(store.rewardClaimed).toBe(false)
    })

    it('returns false for whitespace-only key', () => {
      const store = useValtStore()
      expect(store.claimReward('   ')).toBe(false)
    })

    it('updates goalProgress after claiming', () => {
      const store = useValtStore()
      store.userStats.dailyPoints = 0
      store.claimReward('key')
      // dailyPoints = 100, goal = 100 → 100%
      expect(store.goalProgress).toBe(100)
    })
  })

  // ---------------------------------------------------------------------------
  // Action: claimSpecificReward(reward)
  // ---------------------------------------------------------------------------

  describe('claimSpecificReward(reward)', () => {
    it('marks reward as claimed and returns true', () => {
      const store = useValtStore()
      const reward = { id: 1, claimed: false, points: 500 }
      expect(store.claimSpecificReward(reward)).toBe(true)
      expect(reward.claimed).toBe(true)
    })

    it('adds reward.points to totalPoints and dailyPoints', () => {
      const store = useValtStore()
      const prevTotal = store.userStats.totalPoints
      const prevDaily = store.userStats.dailyPoints
      store.claimSpecificReward({ id: 1, claimed: false, points: 500 })
      expect(store.userStats.totalPoints).toBe(prevTotal + 500)
      expect(store.userStats.dailyPoints).toBe(prevDaily + 500)
    })

    it('updates balance after claiming', () => {
      const store = useValtStore()
      store.userStats.totalPoints = 1000
      store.claimSpecificReward({ id: 1, claimed: false, points: 1000 })
      expect(store.userStats.balance).toBe(200)
    })

    it('returns false and changes nothing for already-claimed reward', () => {
      const store = useValtStore()
      const prevTotal = store.userStats.totalPoints
      const reward = { id: 1, claimed: true, points: 500 }
      expect(store.claimSpecificReward(reward)).toBe(false)
      expect(store.userStats.totalPoints).toBe(prevTotal)
    })
  })

  // ---------------------------------------------------------------------------
  // Action: calculateGoalProgress()
  // ---------------------------------------------------------------------------

  describe('calculateGoalProgress()', () => {
    it('sets 50% progress when dailyPoints equals 50', () => {
      const store = useValtStore()
      store.userStats.dailyPoints = 50
      store.calculateGoalProgress()
      expect(store.goalProgress).toBe(50)
    })

    it('sets 100% progress when dailyPoints equals the goal', () => {
      const store = useValtStore()
      store.userStats.dailyPoints = 100
      store.calculateGoalProgress()
      expect(store.goalProgress).toBe(100)
    })

    it('caps at 100% when dailyPoints exceeds the goal', () => {
      const store = useValtStore()
      store.userStats.dailyPoints = 250
      store.calculateGoalProgress()
      expect(store.goalProgress).toBe(100)
    })

    it('sets 0% when dailyPoints is 0', () => {
      const store = useValtStore()
      store.userStats.dailyPoints = 0
      store.calculateGoalProgress()
      expect(store.goalProgress).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Action: updateSettings(newSettings)
  // ---------------------------------------------------------------------------

  describe('updateSettings(newSettings)', () => {
    it('merges new values without overwriting unchanged fields', () => {
      const store = useValtStore()
      store.updateSettings({ username: 'NewUser', theme: 'light' })
      expect(store.settings.username).toBe('NewUser')
      expect(store.settings.theme).toBe('light')
      expect(store.settings.notifications).toBe(true) // unchanged
    })

    it('only updates the specified fields', () => {
      const store = useValtStore()
      store.updateSettings({ notifications: false })
      expect(store.settings.notifications).toBe(false)
      expect(store.settings.username).toBe('Valt Guest') // unchanged
      expect(store.settings.theme).toBe('dark') // unchanged
    })
  })

  // ---------------------------------------------------------------------------
  // Action: updateCountdown()
  // ---------------------------------------------------------------------------

  describe('updateCountdown()', () => {
    it('decrements countdown by 1', () => {
      const store = useValtStore()
      store.countdown = 10
      store.updateCountdown()
      expect(store.countdown).toBe(9)
    })

    it('resets rewardClaimed when countdown expires', () => {
      const store = useValtStore()
      store.countdown = 1
      store.rewardClaimed = true
      store.updateCountdown() // countdown → 0
      expect(store.countdown).toBe(0)
      store.updateCountdown() // still 0, now resets rewardClaimed
      expect(store.rewardClaimed).toBe(false)
    })

    it('does not decrement below 0', () => {
      const store = useValtStore()
      store.countdown = 0
      store.updateCountdown()
      expect(store.countdown).toBe(0)
    })

    it('leaves rewardClaimed unchanged while countdown > 0', () => {
      const store = useValtStore()
      store.countdown = 5
      store.rewardClaimed = true
      store.updateCountdown()
      expect(store.rewardClaimed).toBe(true)
    })
  })
})
