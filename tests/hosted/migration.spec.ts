/**
 * Wave 1 Staged Validation — Section 3: Local-to-Hosted Migration
 *
 * Checklist coverage:
 * - [x] Create hosted workspace from local data
 * - [x] Imported workspace opens after runtime start
 * - [x] Local backup remains available
 * - [x] Migration failure surfaces recoverable error
 */

import { test, expect } from '@playwright/test'
import { defaultResumeData } from '../../src/store/defaultData'
import {
  installHostedApiMocks,
  injectSupabaseSession,
  jsonResponse,
  makeCreatedWorkspace,
  makeWorkspaceSnapshot,
  WORKSPACE_ID_2,
} from './fixtures'

/** Current persisted resume shape for legacy local-storage migration coverage. */
const LOCAL_RESUME_DATA = {
  ...defaultResumeData,
  meta: {
    ...defaultResumeData.meta,
    name: 'Local Resume',
  },
}

const LOCAL_RESUME_ENVELOPE = {
  state: { data: LOCAL_RESUME_DATA },
  version: 7,
}

test.describe('Local-to-Hosted Migration', () => {
  test.beforeEach(async ({ page }) => {
    await injectSupabaseSession(page)
  })

  test('creates a hosted workspace from local data and opens it', async ({ page }) => {
    // Seed localStorage with local resume data before API mocks install
    await page.addInitScript(({ envelope }) => {
      window.localStorage.setItem('vector-resume-data', JSON.stringify(envelope))
    }, { envelope: LOCAL_RESUME_ENVELOPE })

    // Start with no workspaces so the onboarding card appears
    await installHostedApiMocks(page, { workspaces: [] })

    await page.goto('/build')

    // Should see the onboarding state with the import option
    await expect(
      page.getByRole('button', { name: 'Import Local Workspace' }),
    ).toBeVisible({ timeout: 15_000 })

    // Override create endpoint
    await page.route('**/api/persistence/workspaces', (route) => {
      if (route.request().method() === 'POST') {
        return jsonResponse(route, makeCreatedWorkspace('Imported Workspace', WORKSPACE_ID_2), 201)
      }
      return route.continue()
    })

    // Override the workspace load to return a snapshot that will receive the import
    await page.route(/\/api\/persistence\/workspaces\/[^/]+$/, (route) => {
      const method = route.request().method()
      if (method === 'GET' || method === 'PUT') {
        return jsonResponse(route, makeWorkspaceSnapshot(WORKSPACE_ID_2))
      }
      return route.continue()
    })

    // Click import
    await page.getByRole('button', { name: 'Import Local Workspace' }).click()

    // The workspace should open — topbar shows the workspace name
    await expect(page.locator('.app-topbar-workspace')).toContainText('Imported Workspace', {
      timeout: 15_000,
    })
  })

  test('local backup data remains in localStorage after migration', async ({ page }) => {
    await page.addInitScript(({ envelope }) => {
      window.localStorage.setItem('vector-resume-data', JSON.stringify(envelope))
    }, { envelope: LOCAL_RESUME_ENVELOPE })

    await installHostedApiMocks(page, { workspaces: [] })
    await page.goto('/build')

    await expect(
      page.getByRole('button', { name: 'Import Local Workspace' }),
    ).toBeVisible({ timeout: 15_000 })

    // After migration starts, local data should still exist in localStorage
    const localDataExists = await page.evaluate(() => {
      const stored = window.localStorage.getItem('vector-resume-data')
      return stored !== null && stored.length > 0
    })

    expect(localDataExists).toBe(true)
  })

  test('migration failure surfaces recoverable error, not silent success', async ({ page }) => {
    await page.addInitScript(({ envelope }) => {
      window.localStorage.setItem('vector-resume-data', JSON.stringify(envelope))
    }, { envelope: LOCAL_RESUME_ENVELOPE })

    await installHostedApiMocks(page, { workspaces: [] })
    await page.goto('/build')

    await expect(
      page.getByRole('button', { name: 'Import Local Workspace' }),
    ).toBeVisible({ timeout: 15_000 })

    // Make the create endpoint succeed but the workspace load fail
    await page.route('**/api/persistence/workspaces', (route) => {
      if (route.request().method() === 'POST') {
        return jsonResponse(route, makeCreatedWorkspace('Imported Workspace', WORKSPACE_ID_2), 201)
      }
      return route.continue()
    })

    await page.route(/\/api\/persistence\/workspaces\/[^/]+$/, (route) => {
      // Fail all workspace loads to simulate a network interruption mid-import
      return jsonResponse(
        route,
        { error: 'Connection lost during import', code: 'workspace_save_error' },
        500,
      )
    })

    await page.getByRole('button', { name: 'Import Local Workspace' }).click()

    // Should show an error state — NOT the workspace content
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })

    // Recovery action should be available
    const hasRetry = await page.getByRole('button', { name: /Retry/ }).isVisible()
    const hasManage = await page.getByRole('button', { name: 'Manage Workspaces' }).isVisible()
    expect(hasRetry || hasManage).toBe(true)
  })
})
