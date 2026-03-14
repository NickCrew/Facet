import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

async function loadHostedWorkspaceStoreModule() {
  // @ts-expect-error runtime-tested local proxy module
  return import('../../proxy/hostedWorkspaceStore.js')
}

const baseActor = {
  tenantId: 'tenant-1',
  accountId: 'account-1',
  userId: 'user-1',
  email: 'member@example.com',
}

describe('hostedWorkspaceStore', () => {
  const tempPaths: string[] = []

  afterEach(async () => {
    await Promise.all(
      tempPaths.splice(0).map(async (tempPath) => {
        await rm(tempPath, { recursive: true, force: true })
      }),
    )
  })

  it('persists hosted workspace directory and snapshots to disk across store instances', async () => {
    const { createFileHostedWorkspaceStore } = await loadHostedWorkspaceStoreModule()
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'facet-hosted-workspaces-'))
    tempPaths.push(tempDir)

    const filePath = path.join(tempDir, 'hosted-workspaces.json')
    await writeFile(
      filePath,
      JSON.stringify({
        actors: [
          {
            tenantId: 'tenant-1',
            accountId: 'account-1',
            userId: 'user-1',
            email: 'member@example.com',
            workspaces: [],
          },
        ],
        workspaces: [],
        snapshots: [],
      }),
    )

    const store = createFileHostedWorkspaceStore(filePath)
    const actor = await store.getActor('user-1')
    expect(actor).not.toBeNull()

    const created = await store.createWorkspace(
      {
        tenantId: 'tenant-1',
        accountId: 'account-1',
        userId: 'user-1',
        email: 'member@example.com',
        workspaces: [],
        workspaceMemberships: [],
      },
      { name: 'Durable Workspace', workspaceId: 'durable-1' },
      '2026-03-14T12:00:00.000Z',
    )

    expect(created.workspace).toEqual(
      expect.objectContaining({
        workspaceId: 'durable-1',
        name: 'Durable Workspace',
        revision: 0,
        isDefault: true,
      }),
    )

    const updatedSnapshot = {
      ...created.snapshot,
      workspace: {
        ...created.snapshot.workspace,
        revision: 1,
        updatedAt: '2026-03-14T12:10:00.000Z',
      },
      artifacts: {
        ...created.snapshot.artifacts,
        resume: {
          ...created.snapshot.artifacts.resume,
          revision: 1,
          updatedAt: '2026-03-14T12:10:00.000Z',
          payload: {
            ...created.snapshot.artifacts.resume.payload,
            meta: {
              ...created.snapshot.artifacts.resume.payload.meta,
              name: 'Durable User',
            },
          },
        },
      },
      exportedAt: '2026-03-14T12:10:00.000Z',
    }
    await expect(store.saveWorkspace(updatedSnapshot)).resolves.toEqual(updatedSnapshot)

    const reloadedStore = createFileHostedWorkspaceStore(filePath)
    await expect(reloadedStore.getActor('user-1')).resolves.toEqual({
      tenantId: 'tenant-1',
      accountId: 'account-1',
      userId: 'user-1',
      email: 'member@example.com',
      workspaces: [
        {
          workspaceId: 'durable-1',
          role: 'owner',
          isDefault: true,
        },
      ],
    })
    await expect(reloadedStore.listWorkspacesForActor(actor!)).resolves.toEqual([
      {
        workspaceId: 'durable-1',
        name: 'Durable Workspace',
        revision: 1,
        updatedAt: '2026-03-14T12:10:00.000Z',
        role: 'owner',
        isDefault: true,
      },
    ])
    await expect(reloadedStore.loadWorkspace('tenant-1', 'durable-1')).resolves.toEqual(updatedSnapshot)
    await expect(reloadedStore.loadWorkspace('tenant-2', 'durable-1')).resolves.toBeNull()

    const persisted = JSON.parse(await readFile(filePath, 'utf8')) as {
      actors: Array<{ workspaces: Array<{ workspaceId: string }> }>
      workspaces: Array<{ workspaceId: string }>
      snapshots: Array<{ workspace: { id: string } }>
    }
    expect(persisted.actors[0]?.workspaces[0]?.workspaceId).toBe('durable-1')
    expect(persisted.workspaces[0]?.workspaceId).toBe('durable-1')
    expect(persisted.snapshots[0]?.workspace.id).toBe('durable-1')
  })

  it('returns null for unknown actors and empty lists for actors without workspaces', async () => {
    const { createFileHostedWorkspaceStore } = await loadHostedWorkspaceStoreModule()
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'facet-hosted-workspaces-'))
    tempPaths.push(tempDir)

    const filePath = path.join(tempDir, 'hosted-workspaces.json')
    await writeFile(
      filePath,
      JSON.stringify({
        actors: [{ ...baseActor, workspaces: [] }],
        workspaces: [],
        snapshots: [],
      }),
    )

    const store = createFileHostedWorkspaceStore(filePath)
    await expect(store.getActor('missing-user')).resolves.toBeNull()
    await expect(store.listWorkspacesForActor(baseActor)).resolves.toEqual([])
    await expect(store.loadWorkspace('tenant-1', 'missing-workspace')).resolves.toBeNull()
    await expect(store.loadWorkspace('tenant-2', 'missing-workspace')).resolves.toBeNull()
  })

  it('rejects duplicate workspace ids and keeps a single default workspace', async () => {
    const { createFileHostedWorkspaceStore } = await loadHostedWorkspaceStoreModule()
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'facet-hosted-workspaces-'))
    tempPaths.push(tempDir)

    const filePath = path.join(tempDir, 'hosted-workspaces.json')
    await writeFile(
      filePath,
      JSON.stringify({
        actors: [{ ...baseActor, workspaces: [] }],
        workspaces: [],
        snapshots: [],
      }),
    )

    const store = createFileHostedWorkspaceStore(filePath)
    await store.createWorkspace(
      { ...baseActor, workspaces: [], workspaceMemberships: [] },
      { name: 'First Workspace', workspaceId: 'ws-1' },
      '2026-03-14T12:00:00.000Z',
    )
    const second = await store.createWorkspace(
      { ...baseActor, workspaces: ['ws-1'], workspaceMemberships: [{ workspaceId: 'ws-1', role: 'owner', isDefault: true }] },
      { name: 'Second Workspace', workspaceId: 'ws-2' },
      '2026-03-14T12:05:00.000Z',
    )

    expect(second.workspace.isDefault).toBe(false)
    await expect(
      store.createWorkspace(
        { ...baseActor, workspaces: ['ws-1', 'ws-2'], workspaceMemberships: [] },
        { name: 'Duplicate Workspace', workspaceId: 'ws-2' },
        '2026-03-14T12:10:00.000Z',
      ),
    ).rejects.toThrow(/already exists/i)

    await expect(
      store.listWorkspacesForActor(baseActor),
    ).resolves.toEqual([
      expect.objectContaining({
        workspaceId: 'ws-1',
        isDefault: true,
      }),
      expect.objectContaining({
        workspaceId: 'ws-2',
        isDefault: false,
      }),
    ])
  })

  it('throws helpful errors for missing or malformed store files', async () => {
    const { createFileHostedWorkspaceStore } = await loadHostedWorkspaceStoreModule()
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'facet-hosted-workspaces-'))
    tempPaths.push(tempDir)

    const missingFile = path.join(tempDir, 'missing.json')
    const malformedFile = path.join(tempDir, 'malformed.json')
    await writeFile(malformedFile, '{broken')

    const missingStore = createFileHostedWorkspaceStore(missingFile)
    await expect(missingStore.getActor('user-1')).rejects.toThrow(/ENOENT/)

    const malformedStore = createFileHostedWorkspaceStore(malformedFile)
    await expect(malformedStore.getActor('user-1')).rejects.toThrow(/json|unexpected token/i)
  })

  it('rejects unregistered actors and invalid save attempts', async () => {
    const { createFileHostedWorkspaceStore } = await loadHostedWorkspaceStoreModule()
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'facet-hosted-workspaces-'))
    tempPaths.push(tempDir)

    const filePath = path.join(tempDir, 'hosted-workspaces.json')
    await writeFile(
      filePath,
      JSON.stringify({
        actors: [{ ...baseActor, workspaces: [] }],
        workspaces: [],
        snapshots: [],
      }),
    )

    const store = createFileHostedWorkspaceStore(filePath)
    await expect(
      store.createWorkspace(
        {
          tenantId: 'tenant-1',
          accountId: 'account-2',
          userId: 'missing-user',
          email: 'missing@example.com',
          workspaces: [],
        },
        { name: 'Missing Actor Workspace', workspaceId: 'missing-actor' },
        '2026-03-14T12:00:00.000Z',
      ),
    ).rejects.toThrow(/not provisioned/i)

    const created = await store.createWorkspace(
      { ...baseActor, workspaces: [] },
      { name: 'Known Workspace', workspaceId: 'known-1' },
      '2026-03-14T12:00:00.000Z',
    )

    await expect(
      store.saveWorkspace({
        ...created.snapshot,
        workspace: {
          ...created.snapshot.workspace,
          id: 'unknown-workspace',
        },
      }),
    ).rejects.toThrow(/membership/i)

    await expect(
      store.saveWorkspace({
        ...created.snapshot,
        tenantId: 'tenant-2',
      }),
    ).rejects.toThrow(/provisioned actor/i)
  })
})
