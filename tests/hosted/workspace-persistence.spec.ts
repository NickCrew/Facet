/**
 * Wave 1 Staged Validation — Section 2: Workspace Persistence & Recovery
 *
 * Checklist coverage:
 * - [x] Bootstrap workspace directory
 * - [x] Create workspace
 * - [x] Rename workspace
 * - [x] Delete non-final workspace
 * - [x] Select workspace
 * - [x] Save and verify persistence
 * - [x] Offline recovery state
 * - [x] Reconnect recovery
 */

import { test, expect } from '@playwright/test'
import {
  installHostedApiMocks,
  injectSupabaseSession,
  jsonResponse,
  makeWorkspaceDirectory,
  makeCreatedWorkspace,
  makeRenamedWorkspace,
  makeDeletedWorkspace,
  makeWorkspaceSnapshot,
  WORKSPACE_ID,
  WORKSPACE_ID_2,
} from './fixtures'

test.describe('Workspace Persistence & Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await injectSupabaseSession(page)
  })

  test('bootstraps and displays workspace directory', async ({ page }) => {
    await installHostedApiMocks(page)
    await page.goto('/build')

    // Workspace name should appear in the topbar
    await expect(page.locator('.app-topbar-workspace')).toContainText('Primary Workspace', {
      timeout: 15_000,
    })

    // Sync status should reach ready/saved state
    await expect(
      page.locator('.app-topbar-sync'),
    ).toContainText(/Ready|Saved/, { timeout: 10_000 })
  })

  test('creates a new workspace', async ({ page }) => {
    await installHostedApiMocks(page, {
      workspaces: [
        {
          workspaceId: WORKSPACE_ID,
          name: 'Primary Workspace',
          revision: 1,
          updatedAt: '2026-04-08T00:00:00.000Z',
          role: 'owner',
          isDefault: true,
        },
      ],
    })

    await page.goto('/build')
    await expect(page.locator('.app-topbar-workspace')).toBeVisible({ timeout: 15_000 })

    // Open workspace dialog
    await page.getByLabel('Hosted workspaces').click()
    await expect(page.getByText('Hosted Workspaces')).toBeVisible()

    // Create a new workspace
    await page.getByPlaceholder('Facet Workspace').fill('Test Workspace')

    // Override the POST response to include the new workspace
    await page.route('**/api/persistence/workspaces', (route) => {
      if (route.request().method() === 'POST') {
        return jsonResponse(route, makeCreatedWorkspace('Test Workspace'), 201)
      }
      // Return updated directory with both workspaces on GET
      return jsonResponse(route, makeWorkspaceDirectory([
        {
          workspaceId: WORKSPACE_ID,
          name: 'Primary Workspace',
          revision: 1,
          updatedAt: '2026-04-08T00:00:00.000Z',
          role: 'owner',
          isDefault: true,
        },
        {
          workspaceId: WORKSPACE_ID_2,
          name: 'Test Workspace',
          revision: 1,
          updatedAt: new Date().toISOString(),
          role: 'owner',
          isDefault: false,
        },
      ]))
    })

    await page.getByRole('button', { name: 'Create Empty Workspace' }).click()

    // New workspace should appear in the list
    await expect(page.getByText('Test Workspace')).toBeVisible({ timeout: 10_000 })
  })

  test('renames a workspace', async ({ page }) => {
    await installHostedApiMocks(page, {
      workspaces: [
        {
          workspaceId: WORKSPACE_ID,
          name: 'Primary Workspace',
          revision: 1,
          updatedAt: '2026-04-08T00:00:00.000Z',
          role: 'owner',
          isDefault: true,
        },
        {
          workspaceId: WORKSPACE_ID_2,
          name: 'Old Name',
          revision: 1,
          updatedAt: '2026-04-08T00:00:00.000Z',
          role: 'owner',
          isDefault: false,
        },
      ],
    })

    await page.goto('/build')
    await expect(page.locator('.app-topbar-workspace')).toBeVisible({ timeout: 15_000 })

    // Open workspace dialog
    await page.getByLabel('Hosted workspaces').click()

    // Override PATCH response
    await page.route(/\/api\/persistence\/workspaces\/[^/]+$/, (route) => {
      if (route.request().method() === 'PATCH') {
        return jsonResponse(route, makeRenamedWorkspace(WORKSPACE_ID_2, 'Renamed Workspace'))
      }
      return route.continue()
    })

    // Find the rename input for "Old Name" and rename it
    const renameInput = page.getByRole('textbox', { name: 'Rename Old Name' })
    await renameInput.fill('Renamed Workspace')
    await page.getByRole('button', { name: 'Rename Old Name' }).click()

    // Renamed name should appear
    await expect(page.getByText('Renamed Workspace')).toBeVisible({ timeout: 5_000 })
  })

  test('deletes a non-final workspace', async ({ page }) => {
    await installHostedApiMocks(page, {
      workspaces: [
        {
          workspaceId: WORKSPACE_ID,
          name: 'Primary Workspace',
          revision: 1,
          updatedAt: '2026-04-08T00:00:00.000Z',
          role: 'owner',
          isDefault: true,
        },
        {
          workspaceId: WORKSPACE_ID_2,
          name: 'Expendable Workspace',
          revision: 1,
          updatedAt: '2026-04-08T00:00:00.000Z',
          role: 'owner',
          isDefault: false,
        },
      ],
    })

    await page.goto('/build')
    await expect(page.locator('.app-topbar-workspace')).toBeVisible({ timeout: 15_000 })

    await page.getByLabel('Hosted workspaces').click()
    await expect(page.getByText('Expendable Workspace')).toBeVisible()

    // Override DELETE and subsequent GET
    await page.route(/\/api\/persistence\/workspaces\/[^/]+$/, (route) => {
      if (route.request().method() === 'DELETE') {
        return jsonResponse(route, makeDeletedWorkspace(WORKSPACE_ID_2))
      }
      return route.continue()
    })

    await page.getByRole('button', { name: 'Delete Expendable Workspace' }).click()

    // The deleted workspace should disappear
    await expect(page.getByText('Expendable Workspace')).not.toBeVisible({ timeout: 5_000 })

    // Primary workspace should still be there
    await expect(
      page.locator('.hosted-workspace-item').filter({ hasText: 'Primary Workspace' }),
    ).toBeVisible()
  })

  test('selects a different workspace and content switches', async ({ page }) => {
    await installHostedApiMocks(page, {
      workspaces: [
        {
          workspaceId: WORKSPACE_ID,
          name: 'Primary Workspace',
          revision: 1,
          updatedAt: '2026-04-08T00:00:00.000Z',
          role: 'owner',
          isDefault: true,
        },
        {
          workspaceId: WORKSPACE_ID_2,
          name: 'Secondary Workspace',
          revision: 1,
          updatedAt: '2026-04-08T00:00:00.000Z',
          role: 'owner',
          isDefault: false,
        },
      ],
    })

    await page.goto('/build')
    await expect(page.locator('.app-topbar-workspace')).toContainText('Primary Workspace', {
      timeout: 15_000,
    })

    // Open workspace dialog and select the other workspace
    await page.getByLabel('Hosted workspaces').click()

    // Override the load endpoint to return the second workspace's snapshot
    await page.route(/\/api\/persistence\/workspaces\/[^/]+$/, (route) => {
      if (route.request().method() === 'GET') {
        return jsonResponse(route, makeWorkspaceSnapshot(WORKSPACE_ID_2))
      }
      return route.continue()
    })

    // Find the "Open" button next to "Secondary Workspace"
    const secondaryItem = page.locator('.hosted-workspace-item').filter({
      hasText: 'Secondary Workspace',
    })
    await secondaryItem.getByRole('button', { name: 'Open' }).click()

    // Topbar should now show the new workspace
    await expect(page.locator('.app-topbar-workspace')).toContainText('Secondary Workspace', {
      timeout: 10_000,
    })
  })

  test('offline state surfaces sync recovery indicator', async ({ page }) => {
    await installHostedApiMocks(page)
    await page.goto('/build')
    await expect(page.locator('.app-topbar-workspace')).toBeVisible({ timeout: 15_000 })

    // Wait for initial sync to stabilize
    await expect(page.locator('.app-topbar-sync')).toContainText(/Ready|Saved/, {
      timeout: 10_000,
    })

    // Go offline
    await page.context().setOffline(true)

    // Make the persistence endpoint fail with a network error
    await page.route(/\/api\/persistence\/workspaces\/[^/]+$/, (route) => {
      return route.abort('connectionfailed')
    })

    // Trigger a persisted UI change so the runtime attempts a save while offline.
    await page.getByRole('tab', { name: 'Live' }).click()

    await expect(page.locator('.app-topbar-sync')).toContainText(/Offline|Sync error/, {
      timeout: 10_000,
    })

    // Reconnect
    await page.context().setOffline(false)

    // Restore normal persistence responses
    await page.unrouteAll({ behavior: 'wait' })
    await installHostedApiMocks(page)

    // Trigger another persisted change after reconnect so sync can recover.
    await page.getByRole('tab', { name: 'PDF' }).click()

    await expect(page.locator('.app-topbar-sync')).toContainText(/Ready|Saved/, {
      timeout: 15_000,
    })
  })
})
