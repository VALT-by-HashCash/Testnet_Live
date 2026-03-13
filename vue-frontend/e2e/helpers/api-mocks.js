/**
 * Reusable Playwright route handlers for VALT API endpoints.
 *
 * Import and call these in spec files to intercept network requests and
 * return deterministic mock responses so tests run offline without a real
 * backend.
 *
 * NOTE: When running against `npm run dev` (Vite development mode) the OTP
 * composable (useOtpFlow.js) bypasses send_testnet_code and verify_testnet_code
 * entirely — it simulates tokens locally.  The corresponding mocks below are
 * included for completeness and for any future production-mode test runs.
 */

/**
 * Intercept GET /profiles/get_state/ — ValtDashboard calls this on every
 * mount.  Without a mock the request is proxied to the real backend, which
 * can take up to 5 s before the demo-mode timeout kicks in.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object|null} data  Optional payload to embed in the response body.
 */
export async function mockDashboardStats(page, data = null) {
  await page.route('**/profiles/get_state/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data ?? { success: true, stats: {} }),
    })
  })
}

/**
 * Intercept POST /profiles/send_testnet_code/ — sends an OTP to the user.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ status?: number, body?: object }|null} response
 */
export async function mockSendCode(page, response = null) {
  await page.route('**/profiles/send_testnet_code/**', async (route) => {
    await route.fulfill({
      status: response?.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(response?.body ?? { success: true }),
    })
  })
}

/**
 * Intercept POST /profiles/verify_testnet_code/ — verifies an OTP.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ status?: number, body?: object }|null} response
 */
export async function mockVerifyCode(page, response = null) {
  const defaultBody = {
    success: true,
    message: '10 points awarded.',
    claim_available_at: Math.floor(Date.now() / 1000) + 86_400,
    data: { rank: 1, points: 10, profile_balance: 10 },
  }
  await page.route('**/profiles/verify_testnet_code/**', async (route) => {
    await route.fulfill({
      status: response?.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(response?.body ?? defaultBody),
    })
  })
}

/**
 * Intercept POST /profiles/sign_out/.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function mockSignOut(page) {
  await page.route('**/profiles/sign_out/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })
}

/**
 * Intercept POST /profiles/testnet_reward/ — called by ValtDashboard when
 * the user clicks Claim Points.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ status?: number, body?: object }|null} response
 */
export async function mockTestnetReward(page, response = null) {
  const defaultBody = {
    success: true,
    points: 10,
    profile_balance: 20,
    claim_available_at: Math.floor(Date.now() / 1000) + 86_400,
  }
  await page.route('**/profiles/testnet_reward/**', async (route) => {
    await route.fulfill({
      status: response?.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(response?.body ?? defaultBody),
    })
  })
}
