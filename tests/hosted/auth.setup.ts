/**
 * Auth setup for hosted Wave 1 validation.
 *
 * This setup project saves an authenticated storageState that all hosted
 * spec files depend on. It injects a synthetic Supabase session into
 * localStorage and verifies the app bootstraps without hitting the
 * auth-required gate.
 *
 * To use a REAL authenticated session instead of the synthetic one:
 *   1. Run `npx playwright test --headed --project=hosted-auth-setup`
 *   2. Sign in via GitHub OAuth when the browser opens
 *   3. The storageState will be saved to tests/hosted/.auth/session.json
 *   4. All subsequent `hosted` project tests reuse it
 */

import { test as setup, expect } from '@playwright/test'
import { installHostedApiMocks, injectSupabaseSession } from './fixtures'

const AUTH_STATE_PATH = 'tests/hosted/.auth/session.json'

setup('authenticate hosted session', async ({ page }) => {
  // Install API mocks so bootstrap succeeds without a real backend
  await installHostedApiMocks(page)

  // Inject a synthetic Supabase session
  await injectSupabaseSession(page)

  // Navigate and wait for the app to bootstrap past auth-required
  await page.goto('/build')

  // The app should NOT show the auth-required card
  await expect(
    page.getByRole('status').filter({ hasText: 'Hosted sign-in required' }),
  ).not.toBeVisible({ timeout: 15_000 })

  // Save the authenticated state for dependent tests
  await page.context().storageState({ path: AUTH_STATE_PATH })
})
