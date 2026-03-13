/**
 * E2E: Claim Reward Button State & Cooldown
 *
 * Tests the Claim Points button inside ConnectedDashboard under different
 * signedIn / cooldown conditions.
 *
 * The Claim Points button lives on the "Connect" tab of ValtDashboard.  To
 * reach it we either:
 *   A) Complete the dev-mode OTP flow (for tests that need signedIn === true)
 *   B) Navigate directly to /connected-dashboard (for signedIn === false)
 *
 * After a successful dev-mode OTP verification, useOtpFlow.js always sets
 * claim_available_at = now + 24 h, so the cooldown is always active right
 * after sign-in.  To test the "no cooldown" state we override localStorage
 * and dispatch a storage event to force ConnectedDashboard to re-evaluate
 * its nextClaimAt reactive value.
 */

import { test, expect } from '@playwright/test'
import { mockDashboardStats, mockTestnetReward } from './helpers/api-mocks.js'

const TEST_EMAIL = 'claimer@example.com'

// ---------------------------------------------------------------------------
// Helper: navigate to / and complete the dev OTP flow so we end up on the
// Connect tab with signedIn === true.
// ---------------------------------------------------------------------------
async function reachConnectTab(page, email = TEST_EMAIL) {
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

/**
 * Override claim_available_at and the user-specific valt_next_claim_ key to
 * a past timestamp, then dispatch a storage event so ConnectedDashboard
 * re-evaluates its nextClaimAt and resets remaining to 0.
 */
async function clearCooldown(page, email = TEST_EMAIL) {
  const pastSecs = Math.floor(Date.now() / 1000) - 120
  await page.evaluate(
    ({ email, pastSecs }) => {
      localStorage.setItem('claim_available_at', String(pastSecs))
      // Remove the user-specific key so loadNextClaim falls back to the
      // global claim_available_at (which we just set to the past).
      localStorage.removeItem(`valt_next_claim_${email.toLowerCase()}`)
      // A StorageEvent on the same page won't fire from localStorage.setItem,
      // so we dispatch it manually to trigger ConnectedDashboard's handler.
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'claim_available_at',
          newValue: String(pastSecs),
        }),
      )
    },
    { email, pastSecs },
  )
}

// ---------------------------------------------------------------------------
// Claim button state
// ---------------------------------------------------------------------------

test.describe('Claim button state', () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboardStats(page)
    await mockTestnetReward(page)
  })

  test('Claim Points button is disabled when not signed in', async ({ page }) => {
    // Navigate directly to /connected-dashboard with router-level auth.
    // The ConnectedDashboard component renders with signedIn=false (no parent
    // passes the prop) so canClaim = false.
    await page.addInitScript(() => {
      localStorage.setItem('breadcrumbs_token', 'e2e-test-token-valid')
      localStorage.setItem(
        'breadcrumbs_user',
        JSON.stringify({ email: 'claim-test@example.com', id: '1' }),
      )
    })
    await page.goto('/connected-dashboard')
    await page.waitForURL('**/connected-dashboard', { timeout: 5_000 })

    await expect(page.getByRole('button', { name: /Claim Points/i })).toBeDisabled()
  })

  test('Claim Points button is disabled when cooldown is active', async ({ page }) => {
    // After OTP verification the component always starts with a 24 h cooldown.
    await reachConnectTab(page)
    await expect(page.getByRole('button', { name: /Claim Points/i })).toBeDisabled()
  })

  test('Claim Points button is enabled when cooldown has expired', async ({ page }) => {
    await reachConnectTab(page)
    await clearCooldown(page)
    await expect(
      page.getByRole('button', { name: /Claim Points/i }),
    ).toBeEnabled({ timeout: 3_000 })
  })

  test('Clicking Claim Points stores a next-claim timestamp ~24 h in the future', async ({
    page,
  }) => {
    await reachConnectTab(page)
    await clearCooldown(page)

    const claimBtn = page.getByRole('button', { name: /Claim Points/i })
    await expect(claimBtn).toBeEnabled({ timeout: 3_000 })

    const beforeSec = Math.floor(Date.now() / 1000)
    await claimBtn.click()
    // Allow the optimistic localStorage write (synchronous) to happen.
    await page.waitForTimeout(200)

    const storedAt = await page.evaluate(() => localStorage.getItem('claim_available_at'))
    // The new timestamp should be at least 1 h in the future (nominally 24 h).
    expect(Number(storedAt)).toBeGreaterThan(beforeSec + 3_600)
  })
})

// ---------------------------------------------------------------------------
// Countdown display
// ---------------------------------------------------------------------------

test.describe('Countdown display', () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboardStats(page)
  })

  test('countdown display shows HH:MM:SS format when cooldown is active', async ({ page }) => {
    await reachConnectTab(page)
    // After OTP verify the 24 h cooldown is set; countdown should be visible.
    // Pattern: two digits, colon, two digits, colon, two digits
    await expect(page.locator('text=/\\d{2}:\\d{2}:\\d{2}/')).toBeVisible({ timeout: 3_000 })
  })

  test('countdown display shows "You can claim now" when cooldown expired', async ({ page }) => {
    await reachConnectTab(page)
    await clearCooldown(page)
    await expect(page.getByText('You can claim now')).toBeVisible({ timeout: 3_000 })
  })
})
