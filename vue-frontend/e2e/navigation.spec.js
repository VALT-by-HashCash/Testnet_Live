/**
 * E2E: Router Guards & Navigation
 *
 * Verifies that:
 *   • The root route renders without auth
 *   • Protected routes (/connected-dashboard, /valt-full) redirect unauthenticated
 *     visitors back to /
 *   • Providing a valid token + user in localStorage passes the router guard
 *   • The page title is correct
 *
 * Auth check (authService.isAuthenticated):
 *   - reads `breadcrumbs_token` (must not equal the PLACEHOLDER_TOKEN 'authenticated')
 *   - reads `breadcrumbs_user` (must be valid JSON)
 * Both keys are seeded via page.addInitScript() before navigation so they are
 * present before the Vue app initialises.
 */

import { test, expect } from '@playwright/test'
import { mockDashboardStats } from './helpers/api-mocks.js'

test.beforeEach(async ({ page }) => {
  // Always mock the dashboard stats call so ValtDashboard does not hang
  // waiting on the real backend (5 s demo-mode timeout).
  await mockDashboardStats(page)
})

test('/ loads successfully without authentication', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('text=Claim Your Daily Testnet Code', { timeout: 10_000 })
  expect(new URL(page.url()).pathname).toBe('/')
})

test('/connected-dashboard redirects unauthenticated user to /', async ({ page }) => {
  await page.goto('/connected-dashboard')
  // The router guard should call next('/') and the Home tab should render.
  await page.waitForSelector('text=Claim Your Daily Testnet Code', { timeout: 10_000 })
  expect(new URL(page.url()).pathname).toBe('/')
})

test('/valt-full redirects unauthenticated user to /', async ({ page }) => {
  await page.goto('/valt-full')
  await page.waitForSelector('text=Claim Your Daily Testnet Code', { timeout: 10_000 })
  expect(new URL(page.url()).pathname).toBe('/')
})

test('localStorage with valid token allows access to /connected-dashboard', async ({ page }) => {
  // Set auth data before the app loads so authService.isAuthenticated() returns true.
  await page.addInitScript(() => {
    localStorage.setItem('breadcrumbs_token', 'e2e-test-token-valid')
    localStorage.setItem(
      'breadcrumbs_user',
      JSON.stringify({ email: 'nav-test@example.com', id: 'nav-1' }),
    )
  })

  await page.goto('/connected-dashboard')
  // Router guard should allow through — URL must stay on /connected-dashboard.
  await page.waitForURL('**/connected-dashboard', { timeout: 5_000 })
  expect(new URL(page.url()).pathname).toBe('/connected-dashboard')
})

test('page title contains VALT', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/VALT/i)
})
