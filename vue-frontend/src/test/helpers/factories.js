/**
 * Test data factories — create consistent fake objects for use across tests.
 */

export function createUser(overrides = {}) {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    username: 'testuser',
    ...overrides
  }
}

export function createToken() {
  return 'test-token-abc123'
}

export function createAuthResponse(overrides = {}) {
  return {
    data: {
      token: createToken(),
      user: createUser(),
      ...overrides
    }
  }
}

export function createVerifyResponse(overrides = {}) {
  const claimAt = Math.floor(Date.now() / 1000) + 86400
  return {
    data: {
      success: true,
      message: 'Verification successful. 10 points awarded.',
      claim_available_at: claimAt,
      data: {
        rank: 42,
        points: 1250,
        profile_balance: 125,
        connected_apps: 3,
        last_visit: Math.floor(Date.now() / 1000)
      },
      user: createUser(),
      ...overrides
    }
  }
}

export function createSendCodeResponse(overrides = {}) {
  return {
    data: {
      success: true,
      message: 'Verification code sent.',
      ...overrides
    }
  }
}

export function createApiError(status = 400, message = 'Bad Request') {
  const error = new Error(message)
  error.response = {
    status,
    data: { error: message }
  }
  return error
}

export function createReward(overrides = {}) {
  return {
    id: 1,
    title: 'Daily Bonus',
    points: 100,
    icon: '🎁',
    description: 'Complete daily login',
    claimed: false,
    ...overrides
  }
}
