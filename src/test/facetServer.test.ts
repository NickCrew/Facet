import { afterEach, describe, expect, it } from 'vitest'
import { buildForgedWorkspaceSnapshot } from './fixtures/workspaceSnapshot'

async function loadProxyModules() {
  const [{ createFacetServer }, { createInMemoryWorkspaceStore }] = await Promise.all([
    // @ts-expect-error runtime-tested local proxy module
    import('../../proxy/facetServer.js'),
    // @ts-expect-error runtime-tested local proxy module
    import('../../proxy/persistenceApi.js'),
  ])

  return {
    createFacetServer,
    createInMemoryWorkspaceStore,
  }
}

async function startServer() {
  const { createFacetServer, createInMemoryWorkspaceStore } = await loadProxyModules()
  const store = createInMemoryWorkspaceStore()
  const { server } = createFacetServer({
    allowedOrigins: ['http://localhost:5173'],
    proxyApiKey: 'proxy-key',
    persistenceAuthTokens: [
      {
        token: 'member-token',
        tenantId: 'tenant-1',
        userId: 'user-1',
        workspaces: ['ws-1'],
      },
    ],
    persistenceStore: store,
    anthropicClient: {
      messages: {
        create: async () => ({ content: [], usage: { input_tokens: 0, output_tokens: 0 } }),
      },
    },
    now: () => '2026-03-11T12:00:00.000Z',
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server.')
  }

  return {
    store,
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  }
}

describe('facetServer persistence API', () => {
  const servers = new Set<import('node:http').Server>()

  afterEach(async () => {
    await Promise.all(
      [...servers].map((server) => new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })),
    )
    servers.clear()
  })

  it('requires bearer auth and workspace membership for persistence routes', async () => {
    const { server, baseUrl } = await startServer()
    servers.add(server)

    const missingAuth = await fetch(`${baseUrl}/api/persistence/workspaces/ws-1`, {
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5173',
        'X-Proxy-API-Key': 'proxy-key',
      },
    })
    expect(missingAuth.status).toBe(401)

    const unauthorizedWorkspace = await fetch(`${baseUrl}/api/persistence/workspaces/ws-2`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer member-token',
        Origin: 'http://localhost:5173',
        'X-Proxy-API-Key': 'proxy-key',
      },
    })
    expect(unauthorizedWorkspace.status).toBe(403)
  })

  it('saves and loads tenant-scoped workspaces with server-owned metadata', async () => {
    const { server, baseUrl } = await startServer()
    servers.add(server)

    const saveResponse = await fetch(`${baseUrl}/api/persistence/workspaces/ws-1`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer member-token',
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
        'X-Proxy-API-Key': 'proxy-key',
      },
      body: JSON.stringify({ snapshot: buildForgedWorkspaceSnapshot() }),
    })

    expect(saveResponse.status).toBe(200)
    const savedBody = await saveResponse.json()
    expect(savedBody.snapshot.tenantId).toBe('tenant-1')
    expect(savedBody.snapshot.userId).toBe('user-1')
    expect(savedBody.snapshot.workspace.id).toBe('ws-1')
    expect(savedBody.snapshot.workspace.name).toBe('Incoming Workspace')
    expect(savedBody.snapshot.workspace.revision).toBe(1)
    expect(savedBody.snapshot.workspace.updatedAt).toBe('2026-03-11T12:00:00.000Z')
    expect(savedBody.snapshot.artifacts.resume.artifactId).toBe('ws-1:resume')
    expect(savedBody.snapshot.artifacts.resume.artifactType).toBe('resume')
    expect(savedBody.snapshot.artifacts.resume.workspaceId).toBe('ws-1')
    expect(savedBody.snapshot.artifacts.resume.revision).toBe(1)

    const loadResponse = await fetch(`${baseUrl}/api/persistence/workspaces/ws-1`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer member-token',
        Origin: 'http://localhost:5173',
        'X-Proxy-API-Key': 'proxy-key',
      },
    })

    expect(loadResponse.status).toBe(200)
    const loadedBody = await loadResponse.json()
    expect(loadedBody.snapshot.workspace.revision).toBe(1)
    expect(loadedBody.snapshot.tenantId).toBe('tenant-1')
  })

  it('increments authoritative revisions on subsequent saves and validates payload shape', async () => {
    const { server, baseUrl } = await startServer()
    servers.add(server)

    const headers = {
      Authorization: 'Bearer member-token',
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5173',
      'X-Proxy-API-Key': 'proxy-key',
    }

    await fetch(`${baseUrl}/api/persistence/workspaces/ws-1`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ snapshot: buildForgedWorkspaceSnapshot() }),
    })

    const forgedSnapshot = buildForgedWorkspaceSnapshot()
    const secondSave = await fetch(`${baseUrl}/api/persistence/workspaces/ws-1`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        snapshot: {
          ...forgedSnapshot,
          workspace: {
            ...forgedSnapshot.workspace,
            name: 'Renamed Workspace',
          },
        },
      }),
    })
    const secondBody = await secondSave.json()
    expect(secondBody.snapshot.workspace.revision).toBe(2)
    expect(secondBody.snapshot.artifacts.resume.revision).toBe(2)

    const invalidSave = await fetch(`${baseUrl}/api/persistence/workspaces/ws-1`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        snapshot: {
          ...forgedSnapshot,
          artifacts: {
            ...forgedSnapshot.artifacts,
            pipeline: {
              ...forgedSnapshot.artifacts.pipeline,
              payload: { entries: null },
            },
          },
        },
      }),
    })

    expect(invalidSave.status).toBe(400)
    expect(await invalidSave.json()).toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/invalid artifacts\.pipeline\.payload\.entries/i),
      }),
    )
  })
})
