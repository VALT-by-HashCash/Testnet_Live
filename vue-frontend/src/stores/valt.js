import { defineStore } from 'pinia'
import { authService } from '../services/auth.js'
import { dashboardService } from '../services/dashboard.js'

export const useValtStore = defineStore('valt', {
  state: () => ({
    // User authentication
    user: null,
    isAuthenticated: false,
    
    // Dashboard data
    userStats: {
      dailyPoints: 0,
      totalPoints: 0,
      dailyActions: 0,
      totalActions: 0,
      connectedApps: 0,
      globalRank: 0,
      balance: 0
    },
    
    // App data
    posts: [],
    apps: [],
    notifications: [],
    profileDetails: null,
    
    // UI state
    activeTab: 'Home',
    loading: false,
    error: null,
    
    // Rewards
    rewards: [],
    rewardClaimed: false,
    countdown: 0,
    goalProgress: 0,
    valtKey: '',
    
    // Leaderboard
    leaderboard: [],

    // Traffic stats
    trafficStats: null,
    
    // Settings
    settings: {
      username: 'Valt Guest',
      notifications: true,
      theme: 'dark'
    }
  }),

  getters: {
    timeLeft: (state) => {
      const hours = Math.floor(state.countdown / 3600)
      const minutes = Math.floor((state.countdown % 3600) / 60)
      const seconds = state.countdown % 60
      return { hours, minutes, seconds }
    },

    getTrafficStats(state) {
      return state.trafficStats
    }
  },

  actions: {
    // Initialize store
    async initialize() {
      this.loading = true
      try {
        // Check if user is already authenticated
        if (authService.isAuthenticated()) {
          this.user = authService.getCurrentUser()
          this.isAuthenticated = true
          await this.loadDashboardData()
        }
      } catch (error) {
        console.error('Failed to initialize store:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    // Load all dashboard data
    async loadDashboardData() {
      try {
        this.loading = true
        
        // Load user data from APIs
        const [posts, apps, notifications, profileDetails] = await Promise.all([
          dashboardService.getPosts(),
          dashboardService.getApps(),
          dashboardService.getNotifications(),
          dashboardService.getProfileDetails()
        ])

        // Store the data
        this.posts = posts || []
        this.apps = apps || []
        this.notifications = notifications || []
        this.profileDetails = profileDetails

        // Calculate user statistics
        this.userStats = dashboardService.calculateUserStats(
          this.posts, 
          this.apps, 
          this.profileDetails
        )

        // Set balance (can be enhanced with real balance calculation)
        this.userStats.balance = Math.floor(this.userStats.totalPoints / 10)

        // Load rewards
        this.rewards = dashboardService.getRewards(this.userStats)

        // Set username for settings
        this.settings.username = this.user?.email?.split('@')[0] || 'User'

        // Calculate goal progress
        this.calculateGoalProgress()

      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    // Sign in user
    async signIn(email, password) {
      try {
        this.loading = true
        const result = await authService.signIn(email, password)
        
        if (result.token && result.user) {
          authService.setAuthData(result.token, result.user)
          this.user = result.user
          this.isAuthenticated = true
          await this.loadDashboardData()
        }
        
        return result
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Sign out user
    async signOut() {
      try {
        await authService.signOut()
        this.resetStore()
      } catch (error) {
        console.error('Sign out error:', error)
        this.resetStore() // Reset anyway
      }
    },

    // Reset store to initial state
    resetStore() {
      this.user = null
      this.isAuthenticated = false
      this.posts = []
      this.apps = []
      this.notifications = []
      this.profileDetails = null
      this.userStats = {
        dailyPoints: 0,
        totalPoints: 0,
        dailyActions: 0,
        totalActions: 0,
        connectedApps: 0,
        globalRank: 0,
        balance: 0
      }
      this.rewards = []
      this.error = null
    },

    // Claim reward
    claimReward(valtKey) {
      if (valtKey && valtKey.trim()) {
        this.rewardClaimed = true
        this.countdown = 86400 // 24 hours
        this.userStats.dailyPoints += 100
        this.userStats.totalPoints += 100
        this.userStats.dailyActions += 5
        this.userStats.totalActions += 5
        this.userStats.balance = Math.floor(this.userStats.totalPoints / 10)
        this.calculateGoalProgress()
        return true
      }
      return false
    },

    // Claim specific reward
    claimSpecificReward(reward) {
      if (!reward.claimed) {
        reward.claimed = true
        this.userStats.totalPoints += reward.points
        this.userStats.dailyPoints += reward.points
        this.userStats.balance = Math.floor(this.userStats.totalPoints / 10)
        return true
      }
      return false
    },

    // Calculate goal progress
    calculateGoalProgress() {
      const dailyGoal = 100 // points
      this.goalProgress = Math.min((this.userStats.dailyPoints / dailyGoal) * 100, 100)
    },

    // Update settings
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
      // TODO: Save to backend
    },

    // Update countdown
    updateCountdown() {
      if (this.countdown > 0) {
        this.countdown--
      } else if (this.rewardClaimed) {
        this.rewardClaimed = false
      }
    }
  }
})