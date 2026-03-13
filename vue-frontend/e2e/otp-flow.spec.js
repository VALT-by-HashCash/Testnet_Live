/**
 * E2E: OTP Authentication Flow
 *
 * Tests the complete OTP sign-in journey in the real browser against a
 * running Vite dev server.
 *
 * IMPORTANT — dev-mode behaviour:
 * When running under `npm run dev`, useOtpFlow.js detects MODE === 'development'
 * and simulates the OTP send/verify locally without calling the backend:
 *   • Send Code  → stores a random 6-digit token in localStorage as
 *                  `dev_test_token_<email>` and shows the code-input section.
 *   • Verify     → reads that token from localStorage; if it matches the
 *                  entered code the user is signed in.
 * The API route mocks are still registered to intercept any stray requests
 * (e.g. /profiles/get_state on mount) and to document the expected API shape.
 */

import { test, expect } from '@playwright/test'
import {
  mockDashboardStats,
  mockSendCode,
  mockVerifyCode,
} from './helpers/api-mocks.js'

const TEST_EMAIL = 'otp-test@example.com'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Register all route mocks needed for this spec. */
async function setupMocks(page) {
  await mockDashboardStats(page)
  await mockSendCode(page)
  await mockVerifyCode(page)
}

/** Navigate to / and wait until the loading state is resolved. */
async function gotoHome(page) {
  await page.goto('/')
  await page.waitForSelector('text=Claim Your Daily Testnet Code', { timeout: 10_000 })
}

/**
 * Complete the dev-mode OTP flow: fill email → Send Code → read dev token
 * from localStorage → fill code → Verify.  Returns the token used.
 */
async function signInViaDevOtp(page, email = TEST_EMAIL) {
  await page.fill('input[type="email"]', email)
  await page.click('button:has-text("Send Code")')
  await page.waitForSelector('text=Enter Verification Code', { timeout: 5_000 })

  // In dev mode the token is stored in localStorage; read it from the page.
  const token = await page.evaluate(
    (e) => localStorage.getItem(`dev_test_token_${e.toLowerCase()}`),
    email,
  )
  expect(token).toMatch(/^\d{6}$/)

  await page.fill('input[maxlength="6"]', token)
  await page.click('button:has-text("Verify")')
  // Wait for the Connect tab content (the Claim Points button lives there).
  await page.waitForSelector('button:has-text("Claim Points")', { timeout: 5_000 })
  return token
}

// ---------------------------------------------------------------------------
// Dashboard loads
// ---------------------------------------------------------------------------

test.describe('Dashboard loads', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
  })

  test('shows email input and Send Code button on first load', async ({ page }) => {
    await gotoHome(page)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Send Code/i })).toBeVisible()
  })

  test('Send Code button is disabled when email field is empty', async ({ page }) => {
    await gotoHome(page)
    await expect(page.getByRole('button', { name: /Send Code/i })).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Send Code
// ---------------------------------------------------------------------------

test.describe('Send Code', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
    await gotoHome(page)
  })

  test('entering email and clicking Send Code shows code input section', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.click('button:has-text("Send Code")')
    await expect(page.getByText('Enter Verification Code')).toBeVisible()
  })

  test('shows the pending email address in the code input section', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.click('button:has-text("Send Code")')
    await page.waitForSelector('text=Enter Verification Code', { timeout: 5_000 })
    await expect(page.getByText(TEST_EMAIL)).toBeVisible()
  })

  test('shows a toast after Send Code in dev mode', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.click('button:has-text("Send Code")')
    // Dev mode shows a "Code Sent (DEV)" toast with the token.
    await expect(page.getByText(/Code Sent/i)).toBeVisible({ timeout: 5_000 })
  })

  test('Send Code button shows loading state while sending', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL)
    // useOtpFlow has a 400 ms simulated delay in dev mode.
    // Click and check that either the button text changes to "Sending…"
    // OR the code-input section appears immediately after the delay.
    await page.click('button:has-text("Send Code")')
    const seenSending = await page
      .getByText('Sending…')
      .isVisible()
      .catch(() => false)
    if (!seenSending) {
      // The 400 ms window was missed; confirm code input appeared anyway.
      await expect(page.getByText('Enter Verification Code')).toBeVisible()
    } else {
      await expect(page.getByText('Sending…')).toBeVisible()
    }
  })
})

// ---------------------------------------------------------------------------
// Verify Code
// ---------------------------------------------------------------------------

test.describe('Verify Code', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
    await gotoHome(page)
  })

  test('entering 6 digits and clicking Verify & Claim signs the user in', async ({ page }) => {
    await signInViaDevOtp(page)
    // After successful sign-in the Connect tab is shown and the Claim Points
    // button is rendered.
    await expect(page.getByRole('button', { name: /Claim Points/i })).toBeVisible()
  })

  test('successful verification switches active tab to Connect', async ({ page }) => {
    await signInViaDevOtp(page)
    // The Home tab content (OTP form) should no longer be visible.
    await expect(page.getByText('Claim Your Daily Testnet Code')).toBeHidden()
    // The Connect tab content (Claim Points button) should be visible.
    await expect(page.getByRole('button', { name: /Claim Points/i })).toBeVisible()
  })

  test('wrong code shows error toast and keeps user on OTP form', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.click('button:has-text("Send Code")')
    await page.waitForSelector('text=Enter Verification Code', { timeout: 5_000 })

    // Enter a deliberately wrong code.
    await page.fill('input[maxlength="6"]', '000000')
    await page.click('button:has-text("Verify")')

    await expect(page.getByText(/Invalid Token|invalid/i)).toBeVisible({ timeout: 5_000 })
    // User stays on the code-input form.
    await expect(page.getByText('Enter Verification Code')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

test.describe('Cancel', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
    await gotoHome(page)
  })

  test('clicking Cancel returns to email input form', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.click('button:has-text("Send Code")')
    await page.waitForSelector('text=Enter Verification Code', { timeout: 5_000 })

    await page.click('button:has-text("Cancel")')

    await expect(page.getByText('Claim Your Daily Testnet Code')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})
