/**
 * Wave 1 Staged Validation — Section 1: Hosted Auth & Session
 *
 * Checklist coverage:
 * - [x] Session reuse after reload
 * - [x] Expired-session recovery path
 * - [x] No local proxy header dependency
 */

import { test, expect } from '@playwright/test'
import { installHostedApiMocks, injectSupabaseSession } from './fixtures'

test.describe('Hosted Auth & Session', () => {
  test.beforeEach(async ({ page }) => {
    await installHostedApiMocks(page)
    await injectSupabaseSession(page)
  })

  test('session is reused after hard reload', async ({ page }) => {
    await page.goto('/build')

    // Wait for bootstrap to complete — workspace content visible
    await expect(page.locator('.app-topbar-workspace')).toBeVisible({ timeout: 15_000 })

    // Hard reload
    await page.reload()

    // Session should still be valid — no auth-required card
    await expect(
      page.getByRole('status').filter({ hasText: 'Hosted sign-in required' }),
    ).not.toBeVisible({ timeout: 10_000 })

    // Workspace still displayed
    await expect(page.locator('.app-topbar-workspace')).toBeVisible()
  })

  test('expired session surfaces sign-in recovery path', async ({ page }) => {
    await page.goto('/build')
    await expect(page.locator('.app-topbar-workspace')).toBeVisible({ timeout: 15_000 })

    // Clear the Supabase session from localStorage to simulate expiry
    await page.evaluate(() => {
      const keys = Object.keys(window.localStorage)
      for (const key of keys) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          window.localStorage.removeItem(key)
        }
      }
    })

    // Override the account context endpoint to return 401 (expired token)
    await page.route('**/api/account/context', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token expired', code: 'auth_required' }),
      }),
    )

    // Trigger a re-bootstrap (e.g., by clicking retry or navigating)
    // The app should detect the missing session and show auth-required
    await page.reload()

    // Should show auth-required state with sign-in button
    await expect(
      page.getByRole('button', { name: 'Sign in with GitHub' }),
    ).toBeVisible({ timeout: 10_000 })

    await expect(
      page.getByRole('button', { name: 'Refresh Session' }),
    ).toBeVisible()
  })

  test('no outbound requests use the local proxy header', async ({ page }) => {
    const localProxyHeaderSeen: string[] = []

    // Intercept all API requests and check for the local proxy header
    page.on('request', (request) => {
      const url = request.url()
      if (!url.includes('/api/')) return
      const headers = request.headers()
      if (headers['x-proxy-api-key'] === 'facet-local-proxy') {
        localProxyHeaderSeen.push(url)
      }
    })

    await page.goto('/build')
    await expect(page.locator('.app-topbar-workspace')).toBeVisible({ timeout: 15_000 })

    expect(localProxyHeaderSeen).toEqual([])
  })
})
