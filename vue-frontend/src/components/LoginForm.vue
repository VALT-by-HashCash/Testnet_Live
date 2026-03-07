<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
    <div class="bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <!-- <img src="/icon.png" alt="Logo" class="w-16 h-16 mx-auto mb-4"> -->
        <h1 class="text-3xl font-bold text-white mb-2">VALT Dashboard</h1>
        <p class="text-gray-300">Sign in to your Breadcrumbs account</p>
      </div>

      <form @submit.prevent="handleSignIn" class="space-y-6">
        <!-- Error Message -->
        <div v-if="error" class="bg-red-900/50 border border-red-700 p-3 rounded text-red-200 text-sm">
          {{ error }}
        </div>

        <!-- Email Input -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          >
        </div>

        <!-- Password Input -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
          >
        </div>

        <!-- Remember Me -->
        <div class="flex items-center">
          <input
            id="remember"
            v-model="form.remember"
            type="checkbox"
            class="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
          >
          <label for="remember" class="ml-2 text-sm text-gray-300">
            Remember me
          </label>
        </div>

        <!-- Sign In Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <!-- Footer Links -->
      <div class="mt-6 text-center">
        <div class="text-sm text-gray-400">
          Don't have an account?
          <a href="#" class="text-blue-400 hover:text-blue-300 transition-colors">
            Contact Admin
          </a>
        </div>
      </div>

      <!-- Demo Mode -->
      <div class="mt-6 pt-6 border-t border-gray-700">
        <button
          @click="signInAsDemo"
          class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
        >
          🚀 Try Demo Mode
        </button>
        <p class="text-xs text-gray-400 text-center mt-2">
          Experience the dashboard without signing in
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useValtStore } from '../stores/valt.js'

const router = useRouter()
const store = useValtStore()

// Component state
const loading = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  password: '',
  remember: false
})

// Methods
const handleSignIn = async () => {
  if (loading.value) return
  
  loading.value = true
  error.value = ''

  try {
    await store.signIn(form.email, form.password)
    
    // Save remember preference
    if (form.remember) {
      localStorage.setItem('rememberMe', 'true')
    }
    
    // Navigate to dashboard
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message || 'Sign in failed. Please try again.'
  } finally {
    loading.value = false
  }
}

const signInAsDemo = async () => {
  loading.value = true
  error.value = ''

  try {
    // Create demo user data
    const demoUser = {
      email: 'demo@breadcrumbs.com',
      id: 'demo-user',
      username: 'Demo User'
    }
    
    // Set demo data in store
    store.user = demoUser
    store.isAuthenticated = true
    
    // Load demo dashboard data
    await store.loadDashboardData()
    
    // Navigate to dashboard
    router.push('/dashboard')
  } catch (err) {
    error.value = 'Demo mode failed to load'
  } finally {
    loading.value = false
  }
}
</script>