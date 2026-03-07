/**
 * Unit tests for src/services/auth.js
 *
 * Tests every method of authService in isolation.
 * The api.js module is mocked so no real HTTP calls are made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock is hoisted before imports — mock api.js before authService is imported.
vi.mock('../api.js', () => ({
  default: {
    profiles: {
      signIn: vi.fn(),
      signOut: vi.fn()
    }
  }
}))

import { authService } from '../auth.js'
import apiClient from '../api.js'

// Storage key constants (mirror auth.js internals)
const KEYS = {
  TOKEN: 'breadcrumbs_token',
  USER: 'breadcrumbs_user',
  PROFILE: 'breadcrumbs_profile',
  SESSION: 'breadcrumbs_session_data'
}

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // initialize()
  // ---------------------------------------------------------------------------

  describe('initialize()', () => {
    it('returns { isAuthenticated: false, user: null } when storage is empty', async () => {
      const result = await authService.initialize()
      expect(result.isAuthenticated).toBe(false)
      expect(result.user).toBeNull()
    })

    it('returns { isAuthenticated: true, user } when valid token + user exist', async () => {
      localStorage.setItem(KEYS.TOKEN, 'valid-token')
      localStorage.setItem(KEYS.USER, JSON.stringify({ email: 'test@example.com', id: '1' }))

      const result = await authService.initialize()

      expect(result.isAuthenticated).toBe(true)
      expect(result.user).toEqual({ email: 'test@example.com', id: '1' })
    })

    it('returns not authenticated when token is "authenticated" placeholder', async () => {
      localStorage.setItem(KEYS.TOKEN, 'authenticated')
      localStorage.setItem(KEYS.USER, JSON.stringify({ email: 'test@example.com' }))

      const result = await authService.initialize()

      expect(result.isAuthenticated).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // signIn(email, password)
  // ---------------------------------------------------------------------------

  describe('signIn(email, password)', () => {
    it('returns { token, user } on success with "token" field', async () => {
      apiClient.profiles.signIn.mockResolvedValue({
        data: { token: 'abc123', user: { email: 'test@example.com', id: '1' } }
      })

      const result = await authService.signIn('test@example.com', 'password')

      expect(result.token).toBe('abc123')
      expect(result.user).toEqual({ email: 'test@example.com', id: '1' })
    })

    it('normalizes token from "key" field (DRF token auth format)', async () => {
      apiClient.profiles.signIn.mockResolvedValue({
        data: { key: 'key-token-456', user: { email: 'test@example.com' } }
      })

      const result = await authService.signIn('test@example.com', 'password')

      expect(result.token).toBe('key-token-456')
    })

    it('normalizes token from "sessionToken" field', async () => {
      apiClient.profiles.signIn.mockResolvedValue({
        data: { sessionToken: 'session-789', user: { email: 'test@example.com' } }
      })

      const result = await authService.signIn('test@example.com', 'password')

      expect(result.token).toBe('session-789')
    })

    it('normalizes token from "access_token" field (JWT format)', async () => {
      apiClient.profiles.signIn.mockResolvedValue({
        data: { access_token: 'jwt-000', user: { email: 'test@example.com' } }
      })

      const result = await authService.signIn('test@example.com', 'password')

      expect(result.token).toBe('jwt-000')
    })

    it('normalizes user from "profile" field when no "user" key', async () => {
      apiClient.profiles.signIn.mockResolvedValue({
        data: { token: 'abc123', profile: { email: 'test@example.com', id: 'p-1' } }
      })

      const result = await authService.signIn('test@example.com', 'password')

      expect(result.user).toEqual({ email: 'test@example.com', id: 'p-1' })
    })

    it('falls back to { email } object when no user/profile in response', async () => {
      apiClient.profiles.signIn.mockResolvedValue({
        data: { token: 'abc123' }
      })

      const result = await authService.signIn('test@example.com', 'password')

      expect(result.user).toEqual({ email: 'test@example.com' })
    })

    it('throws using "error" field when no token returned', async () => {
      apiClient.profiles.signIn.mockResolvedValue({
        data: { error: 'Invalid credentials' }
      })

      await expect(
        authService.signIn('test@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials')
    })

    it('throws using "detail" field (DRF validation format)', async () => {
      apiClient.profiles.signIn.mockResolvedValue({
        data: { detail: 'Authentication credentials were not provided.' }
      })

      await expect(
        authService.signIn('test@example.com', 'wrong')
      ).rejects.toThrow('Authentication credentials were not provided.')
    })

    it('throws using "non_field_errors" array (DRF validation format)', async () => {
      apiClient.profiles.signIn.mockResolvedValue({
        data: { non_field_errors: ['Unable to log in with provided credentials.'] }
      })

      await expect(
        authService.signIn('test@example.com', 'wrong')
      ).rejects.toThrow('Unable to log in with provided credentials.')
    })

    it('throws generic "Sign in failed" when no error message in response', async () => {
      apiClient.profiles.signIn.mockResolvedValue({ data: {} })

      await expect(
        authService.signIn('test@example.com', 'wrong')
      ).rejects.toThrow('Sign in failed')
    })

    it('propagates network errors from the API call', async () => {
      apiClient.profiles.signIn.mockRejectedValue(new Error('Network error'))

      await expect(
        authService.signIn('test@example.com', 'password')
      ).rejects.toThrow('Network error')
    })
  })

  // ---------------------------------------------------------------------------
  // setAuthData(token, user)
  // ---------------------------------------------------------------------------

  describe('setAuthData(token, user)', () => {
    it('stores token as string in localStorage', () => {
      authService.setAuthData('my-token', { email: 'test@example.com' })
      expect(localStorage.getItem(KEYS.TOKEN)).toBe('my-token')
    })

    it('stores user as JSON string in localStorage', () => {
      const user = { email: 'test@example.com', id: '1' }
      authService.setAuthData('my-token', user)
      expect(JSON.parse(localStorage.getItem(KEYS.USER))).toEqual(user)
    })
  })

  // ---------------------------------------------------------------------------
  // getCurrentUser()
  // ---------------------------------------------------------------------------

  describe('getCurrentUser()', () => {
    it('returns null when nothing in storage', () => {
      expect(authService.getCurrentUser()).toBeNull()
    })

    it('returns parsed user object from localStorage', () => {
      const user = { email: 'test@example.com', id: '1' }
      localStorage.setItem(KEYS.USER, JSON.stringify(user))
      expect(authService.getCurrentUser()).toEqual(user)
    })

    it('returns null when stored user is invalid JSON', () => {
      localStorage.setItem(KEYS.USER, '{not-valid-json}')
      expect(authService.getCurrentUser()).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // isAuthenticated()
  // ---------------------------------------------------------------------------

  describe('isAuthenticated()', () => {
    it('returns false when no token and no user', () => {
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('returns false when only token exists (no user)', () => {
      localStorage.setItem(KEYS.TOKEN, 'valid-token')
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('returns false when only user exists (no token)', () => {
      localStorage.setItem(KEYS.USER, JSON.stringify({ email: 'test@example.com' }))
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('returns false when token is the "authenticated" placeholder string', () => {
      localStorage.setItem(KEYS.TOKEN, 'authenticated')
      localStorage.setItem(KEYS.USER, JSON.stringify({ email: 'test@example.com' }))
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('returns true when valid token and user are present', () => {
      localStorage.setItem(KEYS.TOKEN, 'real-token')
      localStorage.setItem(KEYS.USER, JSON.stringify({ email: 'test@example.com' }))
      expect(authService.isAuthenticated()).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // checkAuth()
  // ---------------------------------------------------------------------------

  describe('checkAuth()', () => {
    it('returns same result as isAuthenticated() when not authenticated', async () => {
      expect(await authService.checkAuth()).toBe(false)
    })

    it('returns true when user is authenticated', async () => {
      localStorage.setItem(KEYS.TOKEN, 'real-token')
      localStorage.setItem(KEYS.USER, JSON.stringify({ email: 'test@example.com' }))
      expect(await authService.checkAuth()).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // signOut()
  // ---------------------------------------------------------------------------

  describe('signOut()', () => {
    it('clears all four auth keys from localStorage', async () => {
      localStorage.setItem(KEYS.TOKEN, 'token')
      localStorage.setItem(KEYS.USER, JSON.stringify({ email: 'test@example.com' }))
      localStorage.setItem(KEYS.PROFILE, 'profile-data')
      localStorage.setItem(KEYS.SESSION, 'session-data')

      apiClient.profiles.signOut.mockResolvedValue({})

      await authService.signOut()

      expect(localStorage.getItem(KEYS.TOKEN)).toBeNull()
      expect(localStorage.getItem(KEYS.USER)).toBeNull()
      expect(localStorage.getItem(KEYS.PROFILE)).toBeNull()
      expect(localStorage.getItem(KEYS.SESSION)).toBeNull()
    })

    it('returns { success: true }', async () => {
      apiClient.profiles.signOut.mockResolvedValue({})
      const result = await authService.signOut()
      expect(result).toEqual({ success: true })
    })

    it('clears storage and re-throws when API call throws', async () => {
      localStorage.setItem(KEYS.TOKEN, 'token')
      localStorage.setItem(KEYS.USER, JSON.stringify({ email: 'test@example.com' }))
      apiClient.profiles.signOut.mockRejectedValue(new Error('Network error'))

      await expect(authService.signOut()).rejects.toThrow('Network error')

      // Storage is cleared regardless
      expect(localStorage.getItem(KEYS.TOKEN)).toBeNull()
      expect(localStorage.getItem(KEYS.USER)).toBeNull()
    })
  })
})
