import type {
  FacetBillingCheckoutSessionResponse,
  FacetBillingCustomerLinkResponse,
  FacetHostedAccountContextResponse,
  FacetHostedWorkspaceDeleteResponse,
  FacetHostedWorkspaceDirectoryResponse,
  FacetHostedWorkspaceMutationResponse,
} from '../types/hosted'
import { readFacetApiError, toFacetApiError } from './facetApiErrors'

const DEFAULT_PROXY_API_KEY = 'facet-local-proxy'

interface HostedAccountClientOptions {
  endpoint: string
  bearerToken: string
  proxyApiKey?: string
  fetchFn?: typeof fetch
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await readFacetApiError(response, 'Hosted account request failed.')
  }

  return (await response.json()) as T
}

function createRequest(options: HostedAccountClientOptions) {
  const baseUrl = trimTrailingSlash(options.endpoint)
  const fetchFn = options.fetchFn ?? fetch
  const resolvedProxyApiKey =
    options.proxyApiKey ??
    (options.bearerToken ? undefined : DEFAULT_PROXY_API_KEY)

  return (path: string, init: RequestInit = {}) =>
    fetchFn(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${options.bearerToken}`,
        'Content-Type': 'application/json',
        ...(resolvedProxyApiKey ? { 'X-Proxy-API-Key': resolvedProxyApiKey } : {}),
        ...(init.headers ?? {}),
      },
    }).catch((error) => {
      throw toFacetApiError(error, 'Hosted account request failed.')
    })
}

export async function fetchHostedAccountContext(
  options: HostedAccountClientOptions,
): Promise<FacetHostedAccountContextResponse> {
  const response = await createRequest(options)('/api/account/context', {
    method: 'GET',
  })
  return readJson<FacetHostedAccountContextResponse>(response)
}

export async function createHostedBillingCustomer(
  options: HostedAccountClientOptions,
  customerId?: string,
): Promise<FacetBillingCustomerLinkResponse> {
  const response = await createRequest(options)('/api/billing/customer', {
    method: 'POST',
    body: JSON.stringify(customerId ? { customerId } : {}),
  })
  return readJson<FacetBillingCustomerLinkResponse>(response)
}

export async function createHostedCheckoutSession(
  options: HostedAccountClientOptions,
): Promise<FacetBillingCheckoutSessionResponse> {
  const response = await createRequest(options)('/api/billing/checkout-session', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return readJson<FacetBillingCheckoutSessionResponse>(response)
}

export async function listHostedWorkspaces(
  options: HostedAccountClientOptions,
): Promise<FacetHostedWorkspaceDirectoryResponse> {
  const response = await createRequest(options)('/api/persistence/workspaces', {
    method: 'GET',
  })
  return readJson<FacetHostedWorkspaceDirectoryResponse>(response)
}

export async function createHostedWorkspace(
  options: HostedAccountClientOptions,
  input: {
    name?: string
    workspaceId?: string
  } = {},
): Promise<FacetHostedWorkspaceMutationResponse> {
  const response = await createRequest(options)('/api/persistence/workspaces', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return readJson<FacetHostedWorkspaceMutationResponse>(response)
}

export async function renameHostedWorkspace(
  options: HostedAccountClientOptions,
  workspaceId: string,
  name: string,
): Promise<FacetHostedWorkspaceMutationResponse> {
  const response = await createRequest(
    options,
  )(`/api/persistence/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
  return readJson<FacetHostedWorkspaceMutationResponse>(response)
}

export async function deleteHostedWorkspace(
  options: HostedAccountClientOptions,
  workspaceId: string,
): Promise<FacetHostedWorkspaceDeleteResponse> {
  const response = await createRequest(
    options,
  )(`/api/persistence/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: 'DELETE',
  })
  return readJson<FacetHostedWorkspaceDeleteResponse>(response)
}
