/**
 * E2E: ConnectedDashboard State Restoration
 *
 * Tests how ConnectedDashboard loads and reacts to localStorage data and
 * custom events.
 *
 * Two access patterns are used:
 *   A) Direct route — navigate to /connected-dashboard with router-level auth
 *      in localStorage.  ConnectedDashboard renders with signedIn === false
 *      (no parent component passes the prop) so the Claim Points button is
 *      always disabled and remainingText shows '—'.
 *
 *   B) Via OTP flow — complete the dev-mode OTP sign-in on / so ValtDashboard
 *      switches to the Connect tab and passes signedIn === true as a prop.
 *      Pre-seeding `valt_rank` before navigating lets us verify that
 *      loadProfileFromStorage() picks it up on mount / sign-in.
 */

import { test, expect } from '@playwright/test'
import { mockDashboardStats } from './helpers/api-mocks.js'

const TEST_EMAIL = 'cd-test@example.com'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate directly to /connected-dashboard with router-level auth. */
async function gotoConnectedDashboard(page) {
  await page.addInitScript(() => {
    localStorage.setItem('breadcrumbs_token', 'e2e-test-token-valid')
    localStorage.setItem(
      'breadcrumbs_user',
      JSON.stringify({ email: 'cd-nav@example.com', id: 'cd-1' }),
    )
  })
  await page.goto('/connected-dashboard')
  await page.waitForURL('**/connected-dashboard', { timeout: 5_000 })
}

/**
 * Pre-seed localStorage with profile data (rank, points, balance), complete
 * the dev OTP flow on /, and wait for the Connect tab to appear.
 */
async function reachConnectTabWithRank(page, email = TEST_EMAIL, rank = 42) {
  await page.addInitScript(
    ({ rank }) => {
      localStorage.setItem('valt_rank', String(rank))
      localStorage.setItem('valt_points', '100')
      localStorage.setItem('valt_profile_balance', '100')
    },
    { rank },
  )

  await page.goto('/')
  await page.waitForSelector('text=Claim Your Daily Testnet Code', { timeout: 10_000 })

  await page.fill('input[type="email"]', email)
  await page.click('button:has-text("Send Code")')
  await page.waitForSelector('text=Enter Verification Code', { timeout: 5_000 })

  const token = await page.evaluate(
    (e) => localStorage.getItem(`dev_test_token_${e.toLowerCase()}`),
    email,
  )
  expect(token).toMatch(/^\d{6}$/)

  await page.fill('input[maxlength="6"]', token)
  await page.click('button:has-text("Verify")')
  await page.waitForSelector('button:has-text("Claim Points")', { timeout: 5_000 })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('ConnectedDashboard state restoration', () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboardStats(page)
  })

  test('renders rank from localStorage on load', async ({ page }) => {
    await reachConnectTabWithRank(page, TEST_EMAIL, 42)
    // The rank section shows "#{{ globalRank || '—' }}"
    await expect(page.getByText('#42', { exact: true })).toBeVisible()
  })

  test('shows placeholder dash when no localStorage rank data exists', async ({ page }) => {
    // No profile data seeded — gotoConnectedDashboard doesn't seed valt_rank.
    await gotoConnectedDashboard(page)
    await expect(page.getByText('#—', { exact: true })).toBeVisible()
  })

  test('updates rank display when valt-profile-data custom event fires', async ({ page }) => {
    await reachConnectTabWithRank(page, TEST_EMAIL, 10)
    // Confirm initial rank.
    await expect(page.getByText('#10', { exact: true })).toBeVisible()

    // Dispatch the valt-profile-data event with a new rank value.
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('valt-profile-data', {
          detail: { rank: 99, points: 200, profile_balance: 200 },
        }),
      )
    })

    // ConnectedDashboard's profileDataHandler calls applyProfileData which
    // sets globalRank.value = 99.
    await expect(page.getByText('#99', { exact: true })).toBeVisible({ timeout: 3_000 })
  })

  test('Claim Points button is disabled when signedIn prop is false', async ({ page }) => {
    // Direct route — no parent passes signedIn so it defaults to false.
    await gotoConnectedDashboard(page)
    await expect(page.getByRole('button', { name: /Claim Points/i })).toBeDisabled()
  })
})
