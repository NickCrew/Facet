declare module '../../proxy/facetServer.js' {
  import type { Server } from 'node:http'

  interface CreateFacetServerOptions {
    allowedOrigins?: string[]
    proxyApiKey?: string
    persistenceAuthTokens?: Array<{
      token: string
      tenantId: string
      userId: string
      workspaces: string[]
    }>
    persistenceStore?: {
      loadWorkspace: (tenantId: string, workspaceId: string) => unknown
      saveWorkspace: (snapshot: unknown) => unknown
      listWorkspaces: (tenantId: string, workspaceIds: string[]) => unknown[]
    }
    anthropicClient?: {
      messages: {
        create: (params: unknown) => Promise<unknown>
      }
    }
    now?: () => string
  }

  export function createFacetServer(
    options?: CreateFacetServerOptions,
  ): {
    server: Server
    persistenceStore: NonNullable<CreateFacetServerOptions['persistenceStore']>
  }
}

declare module '../../proxy/persistenceApi.js' {
  import type { FacetWorkspaceSnapshot } from '../persistence/contracts'

  export function createInMemoryWorkspaceStore(): {
    loadWorkspace: (tenantId: string, workspaceId: string) => FacetWorkspaceSnapshot | null
    saveWorkspace: (snapshot: FacetWorkspaceSnapshot) => FacetWorkspaceSnapshot
    listWorkspaces: (tenantId: string, workspaceIds: string[]) => FacetWorkspaceSnapshot[]
  }
}
