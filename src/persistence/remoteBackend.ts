import type { PersistenceBackend } from './coordinator'
import type { FacetWorkspaceSnapshot } from './contracts'
import { assertValidWorkspaceSnapshot } from './validation'

const DEFAULT_PROXY_API_KEY = 'facet-local-proxy'

interface RemotePersistenceApiResponse {
  snapshot: FacetWorkspaceSnapshot
}

export interface RemotePersistenceBackendOptions {
  endpoint: string
  bearerToken: string
  proxyApiKey?: string
  fetchFn?: typeof fetch
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const createRemotePersistenceBackend = (
  options: RemotePersistenceBackendOptions,
): PersistenceBackend => {
  const baseUrl = trimTrailingSlash(options.endpoint)
  const fetchFn = options.fetchFn ?? fetch

  const request = async (workspaceId: string, init: RequestInit): Promise<Response> => {
    return fetchFn(`${baseUrl}/workspaces/${encodeURIComponent(workspaceId)}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${options.bearerToken}`,
        'Content-Type': 'application/json',
        'X-Proxy-API-Key': options.proxyApiKey ?? DEFAULT_PROXY_API_KEY,
        ...(init.headers ?? {}),
      },
    })
  }

  const parseSnapshotResponse = async (response: Response) => {
    const payload = (await response.json()) as Partial<RemotePersistenceApiResponse> & {
      error?: string
    }

    if (!response.ok) {
      throw new Error(payload.error ?? `Persistence API error (${response.status})`)
    }

    assertValidWorkspaceSnapshot(payload.snapshot)
    return payload.snapshot
  }

  return {
    kind: 'remote',
    loadWorkspaceSnapshot: async (workspaceId) => {
      const response = await request(workspaceId, {
        method: 'GET',
      })

      if (response.status === 404) {
        return null
      }

      return parseSnapshotResponse(response)
    },
    saveWorkspaceSnapshot: async (snapshot) => {
      const response = await request(snapshot.workspace.id, {
        method: 'PUT',
        body: JSON.stringify({ snapshot }),
      })

      return parseSnapshotResponse(response)
    },
  }
}
