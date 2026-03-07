/**
 * Enhanced API Client for Breadcrumbs Micro-Frontend Architecture
 * Comprehensive integration with all Django backend endpoints
 * Shared authentication state with React frontend
 */

import axios from 'axios'
import { PLACEHOLDER_TOKEN } from './auth.js'

// Use Vite env var in dev or fall back to relative path so Vite proxy (/api -> VITE_DEV_API_TARGET) works.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '' // e.g. "http://localhost:8000/api" in .env.development
const API_BASE_HOST = API_BASE ? API_BASE.replace(/\/api\/?$/,'').replace(/\/$/,'') : ''
// axios instance (rename to avoid collisions with wrapper)
const axiosInstance = axios.create({
  // If API_BASE is provided, use it (allows direct requests). Otherwise use '' so axios sends relative requests to current origin (Vite proxy).
  baseURL: API_BASE || '',
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// small http helper that wraps axiosInstance (used by controllers below)
const httpHelper = {
  raw: axiosInstance,
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),
  patch: (url, data, config) => axiosInstance.patch(url, data, config)
}

// Storage keys matching auth service
const STORAGE_KEYS = {
  TOKEN: 'breadcrumbs_token',
  USER: 'breadcrumbs_user',
  PROFILE: 'breadcrumbs_profile',
  SESSION_DATA: 'breadcrumbs_session_data'
}

// Enhanced request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token && token !== PLACEHOLDER_TOKEN) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token for Django compatibility
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }

    // Add user context if available
    const user = localStorage.getItem(STORAGE_KEYS.USER)
    if (user) {
      try {
        const userData = JSON.parse(user)
        config.headers['X-User-ID'] = userData.id
      } catch (e) {
        console.warn('Invalid user data in storage')
      }
    }

    // Log API calls in development (Vite → import.meta.env.MODE)
    // Normalize duplicate '/api' when baseURL contains '/api' and the request URL also starts with '/api'
    try {
      const base = axiosInstance.defaults && axiosInstance.defaults.baseURL ? String(axiosInstance.defaults.baseURL) : String(API_BASE || '')
      const normalizedBase = base.replace(/\/+$/,'')
      if (normalizedBase === '/api' && typeof config.url === 'string' && config.url.startsWith('/api/')) {
        // remove the leading '/api' from the request path so baseURL + path -> '/api/profiles/...'
        config.url = config.url.replace(/^\/api/, '')
      }
    } catch (e) {
      // ignore normalization errors
    }

    if (import.meta.env.MODE === 'development') {
      console.log(`API ${config.method?.toUpperCase()}: ${config.url}`, config.data || config.params)
    }

    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Enhanced response interceptor with comprehensive error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.MODE === 'development') {
      console.log(`API Response: ${response.config.url}`, response.data)
    }

    // Check for authentication data in response
    if (response.data && response.data.sessionToken) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.sessionToken)
    }

    return response
  },
  (error) => {
    const { response } = error

    // Handle different error types
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear auth and potentially redirect
          console.warn('Authentication failed, clearing stored auth data')
          Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key)
            sessionStorage.removeItem(key)
          })
          
          // Broadcast auth change
          window.dispatchEvent(new CustomEvent('breadcrumbs-auth-change', {
            detail: { isAuthenticated: false, reason: 'unauthorized' }
          }))
          
          // Only redirect if not already on auth page
          if (!window.location.pathname.includes('/auth/') && !window.location.pathname.includes('/login')) {
            window.location.href = '/vue/auth/login'
          }
          break

        case 403:
          console.warn('Access forbidden:', response.data?.message || 'Insufficient permissions')
          break

        case 404:
          console.warn('Resource not found:', response.config?.url)
          break

        case 429:
          console.warn('Rate limit exceeded, please try again later')
          break

        case 500:
        case 502:
        case 503:
        case 504:
          console.error('Server error:', response.status, response.data?.message)
          break

        default:
          console.error('HTTP Error:', response.status, response.data)
      }
    } else if (error.request) {
      // Network error
      console.error('Network error: No response received', error.message)
    } else {
      // Request setup error
      console.error('Request setup error:', error.message)
    }

    return Promise.reject(error)
  }
)


// Comprehensive API endpoints organized by controller
const apiClient = {
  // Raw axios instance
  raw: httpHelper.raw,

  // Generic HTTP methods (delegate to axiosInstance via http)
  get: httpHelper.get,
  post: httpHelper.post,
  put: httpHelper.put,
  delete: httpHelper.delete,
  patch: httpHelper.patch,

  // VALT-specific endpoints
  valt: {
    auth: {
      login: (credentials) => apiClient.profiles.signIn(credentials),
      logout: () => apiClient.profiles.signOut(),
      me: () => apiClient.profiles.get()
    },

    dashboard: {
      stats: async () => {
        const res = await httpHelper.get('/profiles/get_state/')
        const payload = res?.data ? (res.data.stats ?? res.data) : null
        return { data: payload }
      }
    },

    rewards: {
      list: () => httpHelper.get('/offers/get/')
    }
  },

  // Profile Management
  profiles: {
    create: (data) => httpHelper.post('/profiles/create/', data),
    get: () => httpHelper.get('/profiles/get/'),
    update: (data) => httpHelper.post('/profiles/update/', data),
    delete: (data) => httpHelper.post('/profiles/delete/', data),
    signIn: (data) => httpHelper.post('/profiles/sign_in/', data),
    signOut: () => httpHelper.post('/profiles/sign_out/'),
    getState: (params) => httpHelper.get('/profiles/get_state/', { params }),
    getDemoState: (data) => httpHelper.post('/profiles/get_demo_state/', data),
    signInWithGoogle: () => httpHelper.get('/profiles/sign_in_with_google/'),
    signInWithApple: () => httpHelper.get('/profiles/sign_in_with_apple/'),
    verify: (data) => httpHelper.post('/profiles/verify/', data),
    forgotPassword: (data) => httpHelper.post('/profiles/forgot_password/', data),
    resetPassword: (data) => httpHelper.post('/profiles/reset_password/', data),
    resetPin: (data) => httpHelper.post('/profiles/reset_pin/', data),
    confirmSms: (data) => httpHelper.post('/profiles/confirm_sms/', data),
    confirmPin: (data) => httpHelper.post('/profiles/confirm_pin/', data),
    confirmBcmk: (data) => httpHelper.post('/profiles/confirm_bcmk/', data),
    validatePhone: (data) => httpHelper.post('/profiles/validate_phone/', data),
    sendEmailCode: (data) => httpHelper.post('/profiles/send_email_code/', data),
    resendVerificationEmail: (data) => httpHelper.post('/profiles/resend_verification_email/', data),
    submitFeedback: (data) => httpHelper.post('/profiles/submit_feedback/', data),
    askAtlas: (data) => httpHelper.post('/profiles/ask_atlas/', data),
    getRecentLocationData: () => httpHelper.get('/profiles/get_recent_location_data/'),
    testnetReward: (data) => httpHelper.post('/profiles/testnet_reward/', data),
    // paths should not include a hard-coded '/api' prefix so they combine correctly with VITE_API_BASE_URL
    sendTestnetCode: (data) => httpHelper.post('/profiles/send_testnet_code/', data, { withCredentials: true }),
    verifyTestnetCode: (data) => httpHelper.post('/profiles/verify_testnet_code/', data, { withCredentials: true }),
    checkEmailExists: (data) => httpHelper.post('/profiles/check_email_exists/', data, { withCredentials: true }),
  },

  // App Management
  apps: {
    get: () => httpHelper.get('/apps/get/'),
    create: (data) => httpHelper.post('/apps/create/', data),
    update: (data) => httpHelper.post('/apps/update/', data),
    delete: (data) => httpHelper.post('/apps/delete/', data),
    getCredentials: (data) => httpHelper.post('/apps/get_credentials/', data),
    refreshCredentials: (data) => httpHelper.post('/apps/refresh_credentials/', data)
  },

  // Data Source Integrations
  spotify: {
    authorize: () => httpHelper.get('/spotify/authorize/')
  },

  facebook: {
    authorize: () => httpHelper.get('/facebook/authorize/'),
    webhook: (data) => httpHelper.post('/facebook/webhook/', data)
  },

  instagram: {
    authorize: () => httpHelper.get('/instagram/authorize/'),
    webhook: (data) => httpHelper.post('/instagram/webhook/', data)
  },

  plaid: {
    authorize: () => httpHelper.get('/plaid/authorize/'),
    getLinkToken: () => httpHelper.get('/plaid/get_link_token/'),
    webhook: (data) => httpHelper.post('/plaid/webhook/', data)
  },

  location: {
    authorize: () => httpHelper.get('/location/authorize/'),
    webhook: (data) => httpHelper.post('/location/webhook/', data)
  },

  gmail: {
    authorize: () => httpHelper.get('/gmail/authorize/'),
    signIn: () => httpHelper.get('/gmail/sign_in/'),
    webhook: (data) => httpHelper.post('/gmail/webhook/', data)
  },

  chrome: {
    authorize: (data) => httpHelper.post('/chrome/authorize/', data),
    webhook: (data) => httpHelper.post('/chrome/webhook/', data),
    delete: (data) => httpHelper.post('/chrome/delete/', data)
  },

  safari: {
    authorize: (data) => httpHelper.post('/safari/authorize/', data),
    webhook: (data) => httpHelper.post('/safari/webhook/', data),
    delete: (data) => httpHelper.post('/safari/delete/', data)
  },

  // Health & Fitness
  appleHealth: {
    authorize: () => httpHelper.get('/apple_health/authorize/'),
    webhook: (data) => httpHelper.post('/apple_health/webhook/', data)
  },

  fitbit: {
    authorize: () => httpHelper.get('/fitbit/authorize/'),
    webhook: (data) => httpHelper.post('/fitbit/webhook/', data)
  },

  oura: {
    authorize: () => httpHelper.get('/oura/authorize/')
  },

  garmin: {
    authorize: () => httpHelper.get('/garmin/authorize/')
  },

  // Social Media
  twitter: {
    authorize: () => httpHelper.get('/twitter/authorize/')
  },

  youtube: {
    authorize: () => httpHelper.get('/youtube/authorize/'),
    webhook: (data) => httpHelper.post('/youtube/webhook/', data)
  },

  pinterest: {
    authorize: () => httpHelper.get('/pinterest/authorize/')
  },

  reddit: {
    authorize: () => httpHelper.get('/reddit/authorize/')
  },

  github: {
    authorize: () => httpHelper.get('/github/authorize/')
  },

  // Gaming
  steam: {
    validateId: (data) => httpHelper.post('/steam/validate_id/', data),
    authorize: () => httpHelper.get('/steam/authorize/')
  },

  // Calendar
  googleCalendar: {
    authorize: () => httpHelper.get('/google_calendar/authorize/'),
    webhook: (data) => httpHelper.post('/google_calendar/webhook/', data)
  },

  // Utilities
  utils: {
    getToken: () => httpHelper.get('/utils/get_token/'),
    getUploadUrl: (data) => httpHelper.post('/utils/get_upload_url/', data),
    createPaymentIntent: (data) => httpHelper.post('/utils/create_payment_intent/', data),
    updateSubscription: (data) => httpHelper.post('/utils/update_subscription/', data),
    handlePaymentSuccess: (data) => httpHelper.post('/utils/handle_payment_success/', data),
    persistPayment: (data) => httpHelper.post('/utils/persist_payment/', data),
    getStripePortalUrl: () => httpHelper.get('/utils/get_stripe_portal_url/'),
    reportClientError: (data) => httpHelper.post('/utils/report_client_error/', data),
    ping: () => httpHelper.get('/utils/ping/'),
    downloadApp: (marketingId) => httpHelper.get(`/download/${marketingId}`)
  },

  // Offers & Campaigns
  offers: {
    get: () => httpHelper.get('/offers/get/'),
    create: (data) => httpHelper.post('/offers/create/', data),
    update: (data) => httpHelper.post('/offers/update/', data),
    delete: (data) => httpHelper.post('/offers/delete/', data),
    queryBreadcrumbs: (data) => httpHelper.post('/offers/query_breadcrumbs/', data),
    generateBcrk: (data) => httpHelper.post('/offers/generate_bcrk/', data)
  },

  // Notifications
  notifications: {
    get: () => httpHelper.get('/notifications/get/'),
    create: (data) => httpHelper.post('/notifications/create/', data),
    update: (data) => httpHelper.post('/notifications/update/', data),
    delete: (data) => httpHelper.post('/notifications/delete/', data)
  },

  // Posts
  posts: {
    get: () => httpHelper.get('/posts/get/'),
    create: (data) => httpHelper.post('/posts/create/', data),
    update: (data) => httpHelper.post('/posts/update/', data),
    delete: (data) => httpHelper.post('/posts/delete/', data)
  },

  // File Uploads
  userUploads: {
    get: () => httpHelper.get('/user_uploads/get/'),
    create: (data) => httpHelper.post('/user_uploads/create/', data),
    update: (data) => httpHelper.post('/user_uploads/update/', data),
    delete: (data) => httpHelper.post('/user_uploads/delete/', data)
  },

  // Buyers (Data Buyers)
  buyers: {
    get: () => httpHelper.get('/buyers/get/'),
    create: (data) => httpHelper.post('/buyers/create/', data),
    update: (data) => httpHelper.post('/buyers/update/', data),
    delete: (data) => httpHelper.post('/buyers/delete/', data),
    signIn: (data) => httpHelper.post('/buyers/sign_in/', data),
    signOut: () => httpHelper.post('/buyers/sign_out/'),
    getState: () => httpHelper.get('/buyers/get_state/'),
    getData: (data) => httpHelper.post('/buyers/get_data/', data),
    getCampaigns: (data) => httpHelper.post('/buyers/get_campaigns/', data)
  }
}

// Helper functions for common operations
export const apiHelpers = {
  // Check if API is available
  async healthCheck() {
    try {
      const response = await apiClient.utils.ping()
      return { healthy: true, data: response.data }
    } catch (error) {
      return { healthy: false, error: error.message }
    }
  },

  // Handle file uploads with progress
  async uploadFile(file, onProgress) {
    try {
      const uploadUrlResponse = await apiClient.utils.getUploadUrl({
        filename: file.name,
        contentType: file.type,
        size: file.size
      })

      if (uploadUrlResponse.data.upload_url) {
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await axiosInstance.post(uploadUrlResponse.data.upload_url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (onProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              onProgress(percentCompleted)
            }
          }
        })

        return { success: true, data: uploadResponse.data }
      } else {
        throw new Error('Failed to get upload URL')
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Export the api client
export default apiClient