import apiClient from './api.js'

export const PLACEHOLDER_TOKEN = 'authenticated'

const STORAGE_KEYS = {
  TOKEN: 'breadcrumbs_token',
  USER: 'breadcrumbs_user',
  PROFILE: 'breadcrumbs_profile',
  SESSION_DATA: 'breadcrumbs_session_data'
}

export const authService = {
  async initialize() {
    const isAuth = this.isAuthenticated()
    const user = this.getCurrentUser()
    return { isAuthenticated: isAuth, user }
  },

  async signIn(email, password) {
    const response = await apiClient.profiles.signIn({ email, password })
    const data = response.data

    // Normalize token field — Django REST framework can return different keys
    const token = data.token || data.sessionToken || data.key || data.access_token
    // Normalize user field
    const user = data.user || data.profile || { email }

    if (!token) {
      const msg = data.error || data.detail || data.non_field_errors?.[0] || 'Sign in failed'
      throw new Error(msg)
    }

    return { token, user }
  },

  setAuthData(token, user) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const user = this.getCurrentUser()
    return !!(token && token !== PLACEHOLDER_TOKEN && user)
  },

  async checkAuth() {
    return this.isAuthenticated()
  },

  async signOut() {
    let serverError = null
    try {
      await apiClient.profiles.signOut()
    } catch (err) {
      serverError = err
      console.warn('signOut: server session invalidation failed', err?.response?.status ?? err?.message)
    } finally {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
    }
    if (serverError) throw serverError
    return { success: true }
  }
}
