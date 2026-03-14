declare module '../../proxy/facetServer.js' {
  import type { IncomingMessage, Server } from 'node:http'
  import type { JWK } from 'jose'

  interface HostedWorkspaceMembership {
    workspaceId: string
    role: 'owner'
    isDefault: boolean
  }

  interface HostedWorkspaceActor {
    tenantId: string
    accountId: string
    userId: string
    email: string
    workspaces: HostedWorkspaceMembership[]
  }

  interface CreateFacetServerOptions {
    authMode?: 'local' | 'hosted'
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
    hostedWorkspaceStore?: {
      getActor: (userId: string) => Promise<HostedWorkspaceActor | null>
    }
    anthropicClient?: {
      messages: {
        create: (params: unknown) => Promise<unknown>
      }
    }
    persistenceActorResolver?: (req: IncomingMessage) => Promise<unknown>
    hostedAuth?: {
      issuer?: string
      audience?: string
      jwksUrl?: string
      jwks?: { keys: JWK[] }
      membershipStore?: {
        getActor: (userId: string) => Promise<unknown>
      }
    }
    billingStore?: {
      getAccountState: (tenantId: string, accountId: string) => Promise<unknown>
      upsertAccountState: (entry: unknown) => Promise<unknown>
    }
    stripeClient?: {
      customers: {
        create: (params: unknown) => Promise<{ id: string }>
        retrieve: (customerId: string) => Promise<{ id: string, deleted?: boolean }>
      }
      checkout: {
        sessions: {
          create: (params: unknown) => Promise<{ id: string, url: string }>
        }
      }
    }
    stripeSecretKey?: string
    stripePriceId?: string
    billingSuccessUrl?: string
    billingCancelUrl?: string
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
  import type { IncomingMessage } from 'node:http'
  import type { FacetWorkspaceSnapshot } from '../persistence/contracts'

  export function createInMemoryWorkspaceStore(): {
    loadWorkspace: (tenantId: string, workspaceId: string) => FacetWorkspaceSnapshot | null
    saveWorkspace: (snapshot: FacetWorkspaceSnapshot) => FacetWorkspaceSnapshot
    listWorkspaces: (tenantId: string, workspaceIds: string[]) => FacetWorkspaceSnapshot[]
  }

  export function createTokenActorResolver(authTokens: Array<{
    token: string
    tenantId: string
    userId: string
    workspaces: string[]
  }>): (req: IncomingMessage) => Promise<unknown>
}

declare module '../../proxy/hostedAuth.js' {
  import type { IncomingMessage } from 'node:http'
  import type { JWK } from 'jose'

  export function createHostedSessionActorResolver(options: {
    issuer: string
    audience: string
    jwks?: { keys: JWK[] }
    jwksUrl?: string
    membershipStore: {
      getActor: (userId: string) => Promise<unknown>
    }
  }): (req: IncomingMessage) => Promise<unknown>
}

declare module '../../proxy/hostedWorkspaceStore.js' {
  interface HostedWorkspaceMembership {
    workspaceId: string
    role: 'owner'
    isDefault?: boolean
  }

  interface HostedWorkspaceActor {
    tenantId: string
    accountId: string
    userId: string
    email: string
    workspaces?: HostedWorkspaceMembership[]
  }

  interface HostedWorkspaceSummary {
    workspaceId: string
    name: string
    revision: number
    updatedAt: string
    role: 'owner'
    isDefault: boolean
  }

  export function createInMemoryHostedWorkspaceStore(directory?: {
    actors?: HostedWorkspaceActor[]
    workspaces?: unknown[]
    snapshots?: unknown[]
  }): {
    getActor: (userId: string) => Promise<HostedWorkspaceActor | null>
    loadWorkspace: (tenantId: string, workspaceId: string) => Promise<unknown>
    saveWorkspace: (snapshot: unknown) => Promise<unknown>
    listWorkspacesForActor: (actor: Pick<HostedWorkspaceActor, 'userId'>) => Promise<HostedWorkspaceSummary[]>
    createWorkspace: (
      actor: HostedWorkspaceActor,
      input: { name?: string, workspaceId?: string },
      timestamp: string,
    ) => Promise<unknown>
    renameWorkspace: (actor: HostedWorkspaceActor, workspaceId: string, name: string, timestamp: string) => Promise<unknown>
    deleteWorkspace: (actor: HostedWorkspaceActor, workspaceId: string) => Promise<unknown>
  }

  export function createFileHostedWorkspaceStore(filePath: string): {
    getActor: (userId: string) => Promise<HostedWorkspaceActor | null>
    loadWorkspace: (tenantId: string, workspaceId: string) => Promise<unknown>
    saveWorkspace: (snapshot: unknown) => Promise<unknown>
    listWorkspacesForActor: (actor: Pick<HostedWorkspaceActor, 'userId'>) => Promise<HostedWorkspaceSummary[]>
    createWorkspace: (
      actor: HostedWorkspaceActor,
      input: { name?: string, workspaceId?: string },
      timestamp: string,
    ) => Promise<unknown>
    renameWorkspace: (actor: HostedWorkspaceActor, workspaceId: string, name: string, timestamp: string) => Promise<unknown>
    deleteWorkspace: (actor: HostedWorkspaceActor, workspaceId: string) => Promise<unknown>
  }
}

declare module '../../proxy/billingState.js' {
  export function createInMemoryHostedBillingStore(records?: unknown[]): {
    getAccountState: (tenantId: string, accountId: string) => Promise<unknown>
    upsertAccountState: (entry: unknown) => Promise<unknown>
  }
}
