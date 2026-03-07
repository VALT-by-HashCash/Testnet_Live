<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <!-- Navigation Header -->
    <!-- <CrossAppNavigation /> -->
    
    <div class="container mx-auto px-4 py-8">
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-white mb-4">🔗 VALT Components Showcase</h1>
        <p class="text-xl text-gray-300 max-w-3xl mx-auto">
          All standalone HTML app components successfully integrated with responsive Tailwind CSS styling
        </p>
        <div class="mt-6 inline-flex items-center px-4 py-2 bg-green-900/50 border border-green-700 rounded-lg">
          <svg class="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="text-green-300 font-medium">3 Core Components Active (5 Hidden)</span>
        </div>
      </div>

      <!-- Component Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <!-- VALT Dashboard Simple -->
        <!-- <div class="card-hover bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
              <span class="text-white text-xl">📊</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">VALT Dashboard</h3>
              <p class="text-sm text-gray-400">Simple Layout</p>
            </div>
          </div>
          <p class="text-gray-300 mb-4">Clean, lightweight dashboard with essential VALT features and responsive design.</p>
          <div class="flex gap-2">
            <router-link 
              to="/valt" 
              class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
            >
              View Component
            </router-link>
          </div>
        </div> -->

        <!-- VALT Dashboard Full -->
        <div class="card-hover bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
              <span class="text-white text-xl">📈</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">VALT Dashboard Full</h3>
              <p class="text-sm text-gray-400">Complete Features</p>
            </div>
          </div>
          <p class="text-gray-300 mb-4">Comprehensive dashboard with analytics, rewards, leaderboard, and advanced features.</p>
          <div class="flex gap-2">
            <router-link 
              to="/valt-full" 
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
            >
              View Component
            </router-link>
          </div>
        </div>

        <!-- VALT Dashboard Fixed - COMMENTED OUT FOR LATER USE -->
        <!-- <div class="card-hover bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
              <span class="text-white text-xl">🔧</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">VALT Dashboard Fixed</h3>
              <p class="text-sm text-gray-400">Fixed Layout</p>
            </div>
          </div>
          <p class="text-gray-300 mb-4">Alternative dashboard layout with fixed positioning and optimized structure.</p>
          <div class="flex gap-2">
            <router-link 
              to="/valt-fixed" 
              class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
            >
              View Component
            </router-link>
          </div>
        </div> -->

        <!-- Login Form -->
        <div class="card-hover bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
              <span class="text-white text-xl">🔐</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Login Form</h3>
              <p class="text-sm text-gray-400">Authentication</p>
            </div>
          </div>
          <p class="text-gray-300 mb-4">Breadcrumbs-branded login interface with demo mode and secure authentication.</p>
          <div class="flex gap-2">
            <router-link 
              to="/login" 
              class="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
            >
              View Component
            </router-link>
          </div>
        </div>

        <!-- Cross App Navigation - COMMENTED OUT FOR LATER USE -->
        <!-- <div class="card-hover bg-gradient-to-br from-pink-900/50 to-rose-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mr-4">
              <span class="text-white text-xl">🔄</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Cross-App Navigation</h3>
              <p class="text-sm text-gray-400">Navigation Hub</p>
            </div>
          </div>
          <p class="text-gray-300 mb-4">Seamless navigation system for switching between React and Vue frontends.</p>
          <div class="flex gap-2">
            <router-link 
              to="/navigation" 
              class="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
            >
              View Component
            </router-link>
          </div>
        </div> -->

        <!-- Debug Tools - COMMENTED OUT FOR LATER USE -->
        <!-- <div class="card-hover bg-gradient-to-br from-gray-900/50 to-slate-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mr-4">
              <span class="text-white text-xl">🐛</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Debug Tools</h3>
              <p class="text-sm text-gray-400">Development</p>
            </div>
          </div>
          <p class="text-gray-300 mb-4">Development utilities and debugging tools for testing and integration.</p>
          <div class="flex gap-2">
            <router-link 
              to="/debug" 
              class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
            >
              View Component
            </router-link>
          </div>
        </div> -->

        <!-- Auth Service Test -->
        <div class="card-hover bg-gradient-to-br from-teal-900/50 to-cyan-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mr-4">
              <span class="text-white text-xl">🔍</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Auth Service Test</h3>
              <p class="text-sm text-gray-400">API Testing</p>
            </div>
          </div>
          <p class="text-gray-300 mb-4">API connectivity testing and authentication service verification tools.</p>
          <div class="flex gap-2">
            <router-link 
              to="/auth-test" 
              class="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
            >
              View Component
            </router-link>
          </div>
        </div>

        <!-- Tailwind Test - COMMENTED OUT FOR LATER USE -->
        <!-- <div class="card-hover bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mr-4">
              <span class="text-white text-xl">🎨</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Tailwind CSS Test</h3>
              <p class="text-sm text-gray-400">Responsive Design</p>
            </div>
          </div>
          <p class="text-gray-300 mb-4">Responsive design verification and Tailwind CSS styling test component.</p>
          <div class="flex gap-2">
            <router-link 
              to="/tailwind-test" 
              class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
            >
              View Component
            </router-link>
          </div>
        </div> -->
      </div>

      <!-- Integration Status -->
      <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-sm border border-green-700 rounded-xl p-6 mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">✅ Integration Complete</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-semibold text-green-400 mb-2">Frontend Features</h3>
            <ul class="text-gray-300 space-y-1">
              <li>✅ Responsive Tailwind CSS styling</li>
              <li>✅ Vue 3 Composition API</li>
              <li>✅ Pinia state management</li>
              <li>✅ Vue Router navigation</li>
              <li>✅ Glass-morphism UI effects</li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-green-400 mb-2">Backend Integration</h3>
            <ul class="text-gray-300 space-y-1">
              <li>✅ Django API connectivity</li>
              <li>✅ Authentication system</li>
              <li>✅ CSRF protection</li>
              <li>✅ Mock data fallbacks</li>
              <li>✅ Cross-app navigation</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Service Status -->
      <div class="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-700 rounded-xl p-6">
        <h2 class="text-2xl font-bold text-white mb-4">🔗 Service Status</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gray-800/50 rounded-lg p-4 text-center">
            <div class="text-2xl mb-2">🗄️</div>
            <div class="text-sm text-gray-400">Database</div>
            <div class="text-green-400 font-semibold">PostgreSQL:5432</div>
          </div>
          <div class="bg-gray-800/50 rounded-lg p-4 text-center">
            <div class="text-2xl mb-2">⚙️</div>
            <div class="text-sm text-gray-400">Backend</div>
            <div class="text-green-400 font-semibold">Django:8000</div>
          </div>
          <div class="bg-gray-800/50 rounded-lg p-4 text-center">
            <div class="text-2xl mb-2">⚛️</div>
            <div class="text-sm text-gray-400">React App</div>
            <div class="text-green-400 font-semibold">Port:3000</div>
          </div>
          <div class="bg-gray-800/50 rounded-lg p-4 text-center">
            <div class="text-2xl mb-2">🔗</div>
            <div class="text-sm text-gray-400">Vue App</div>
            <div class="text-green-400 font-semibold">Port:3003</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// CrossAppNavigation component - commented out for now
// import CrossAppNavigation from '../components/CrossAppNavigation.vue'
</script>

<style scoped>
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
}
</style>