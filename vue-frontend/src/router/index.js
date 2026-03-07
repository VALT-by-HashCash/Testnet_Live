import { createRouter, createWebHistory } from 'vue-router'
import { useValtStore } from '../stores/valt.js'
import ConnectedDashboard from '../components/ConnectedDashboard.vue'
import ValtDashboard from '../components/ValtDashboard.vue'

const routes = [
  // DEFAULT ROUTE - VALT TestNet Dashboard (Live Production)
  {
    path: '/',
    name: 'ValtDashboardFull',
    component: ValtDashboard,
    meta: {
      requiresAuth: false,
      title: 'VALT Dashboard - TestNet'
    }
  },
  {
    path: '/connected-dashboard',
    name: 'ConnectedDashboard',
    component: ConnectedDashboard,
    meta: {
      requiresAuth: true,
      title: 'Connected - Dashboard'
    }
  },
  // Component Showcase - COMMENTED OUT FOR LATER USE
  // {
  //   path: '/',
  //   name: 'ComponentShowcase',
  //   component: () => import('../views/ComponentShowcase.vue'),
  //   meta: {
  //     requiresAuth: false,
  //     title: 'VALT Components Showcase'
  //   }
  // },
  
  // Alternative path for accessing ComponentShowcase directly
  // {
  //   path: '/showcase',
  //   name: 'ComponentShowcase',
  //   component: () => import('../views/ComponentShowcase.vue'),
  //   meta: {
  //     requiresAuth: false,
  //     title: 'VALT Components Showcase'
  //   }
  // },
  
  // Component showcase routes - All standalone components accessible
  // {
  //   path: '/valt',
  //   name: 'ValtDashboard',
  //   component: () => import('../components/ValtDashboardSimple.vue'),
  //   meta: {
  //     requiresAuth: false,
  //     title: 'VALT Dashboard - Simple'
  //   }
  // },
  
  // Alternative path to access full dashboard (same as root)
  {
    path: '/valt-full',
    name: 'ValtDashboardFullAlt',
    component: ValtDashboard,
    meta: {
      requiresAuth: true,
      title: 'VALT Dashboard - Full Featured'
    }
  },
  
  // VALT Dashboard Fixed - COMMENTED OUT FOR LATER USE
  // {
  //   path: '/valt-fixed',
  //   name: 'ValtDashboardFixed',
  //   component: () => import('../components/ValtDashboardFixed.vue'),
  //   meta: {
  //     requiresAuth: false,
  //     title: 'VALT Dashboard - Fixed Layout'
  //   }
  // },
  
  // Login Page - COMMENTED OUT FOR LATER USE
  // {
  //   path: '/login',
  //   name: 'Login',
  //   component: () => import('../components/LoginForm.vue'),
  //   meta: {
  //     requiresAuth: false,
  //     title: 'VALT Login'
  //   }
  // },
  // Cross App Navigation - COMMENTED OUT FOR LATER USE
  // {
  //   path: '/navigation',
  //   name: 'CrossNavigation',
  //   component: () => import('../components/CrossAppNavigation.vue'),
  //   meta: {
  //     requiresAuth: false,
  //     title: 'Cross-App Navigation'
  //   }
  // },
  // Debug - COMMENTED OUT FOR LATER USE
  // {
  //   path: '/debug',
  //   name: 'Debug',
  //   component: () => import('../components/DebugTest.vue'),
  //   meta: {
  //     requiresAuth: false,
  //     title: 'Debug Tools'
  //   }
  // },
  // Auth Test - COMMENTED OUT (component doesn't exist)
  // {
  //   path: '/auth-test',
  //   name: 'AuthTest',
  //   component: () => import('../components/AuthServiceTest.vue'),
  //   meta: {
  //     requiresAuth: false,
  //     title: 'Authentication Test'
  //   }
  // },
  // Tailwind Test - COMMENTED OUT FOR LATER USE
  // {
  //   path: '/tailwind-test',
  //   name: 'TailwindTest',
  //   component: () => import('../components/TailwindTest.vue'),
  //   meta: {
  //     requiresAuth: false,
  //     title: 'Tailwind CSS Test'
  //   }
  // },
  // Legacy routes for compatibility
  
  // Dashboard - COMMENTED OUT FOR LATER USE
  // {
  //   path: '/dashboard',
  //   name: 'Dashboard', 
  //   component: Dashboard,
  //   meta: {
  //     requiresAuth: true,
  //     title: 'User Dashboard'
  //   }
  // }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const store = useValtStore()
  
  // Initialize store if not already done
  if (!store.$state.isAuthenticated && !store.$state.loading) {
    await store.initialize()
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // Since login route is commented out, redirect to home for auth failures
  if (requiresAuth && !store.isAuthenticated) {
    next('/')
  } else if (to.path === '/login' && store.isAuthenticated) {
    // Dashboard and login routes are commented out, redirect to home
    next('/')
  } else {
    next()
  }
})

export default router