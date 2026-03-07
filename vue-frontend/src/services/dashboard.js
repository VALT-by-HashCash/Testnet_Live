// Minimal dashboard service for TestNet
export const dashboardService = {
  async getUserStats() {
    return {}
  },

  async getPosts() {
    return []
  },

  async getApps() {
    return []
  },

  async getNotifications() {
    return []
  },

  async getProfileDetails() {
    return null
  },

  calculateUserStats(posts = [], apps = [], profileDetails = null) {
    return {
      dailyPoints: 0,
      totalPoints: 0,
      dailyActions: 0,
      totalActions: 0,
      connectedApps: apps.length,
      globalRank: 0,
      balance: 0
    }
  },

  getRewards(userStats = {}) {
    return []
  },

  getTrafficStats() {
    return null
  }
}
