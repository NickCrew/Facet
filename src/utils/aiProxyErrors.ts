import type { FacetAiAccessDenialReason, FacetAiFeatureKey } from '../types/hosted'

type FacetAiProxyErrorCode =
  | 'ai_access_denied'
  | 'auth_required'
  | 'auth_internal_error'

interface FacetAiProxyErrorPayload {
  error?: unknown
  code?: unknown
  reason?: unknown
  feature?: unknown
  message?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export class FacetAiProxyError extends Error {
  status: number
  code: FacetAiProxyErrorCode | null
  reason: FacetAiAccessDenialReason | 'auth_required' | null
  feature: FacetAiFeatureKey | null

  constructor(
    message: string,
    options: {
      status: number
      code?: FacetAiProxyErrorCode | null
      reason?: FacetAiAccessDenialReason | 'auth_required' | null
      feature?: FacetAiFeatureKey | null
    },
  ) {
    super(message)
    this.name = 'FacetAiProxyError'
    this.status = options.status
    this.code = options.code ?? null
    this.reason = options.reason ?? null
    this.feature = options.feature ?? null
  }
}

function toErrorText(status: number, fallback: string) {
  const message = fallback.trim()
  return `AI proxy error (${status}): ${message.slice(0, 160)}`
}

function readNestedMessage(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (!isRecord(value)) {
    return ''
  }

  if (typeof value.message === 'string' && value.message.trim()) {
    return value.message.trim()
  }

  return ''
}

function isBillingIssueMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('credit balance is too low') ||
    normalized.includes('plans & billing') ||
    (normalized.includes('billing') && normalized.includes('anthropic api'))
  )
}

export async function readAiProxyError(response: Response): Promise<Error> {
  const text = await response.text()
  let parsed: unknown = null

  if (text.trim()) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = null
    }
  }

  const payload = isRecord(parsed) ? (parsed as FacetAiProxyErrorPayload) : null
  const errorMessage =
    (
      payload &&
      (
        (typeof payload.error === 'string' && payload.error.trim()) ||
        readNestedMessage(payload.error) ||
        (typeof payload.message === 'string' && payload.message.trim())
      )
    ) || text.trim()

  const code =
    payload?.code === 'ai_access_denied' ||
    payload?.code === 'auth_required' ||
    payload?.code === 'auth_internal_error'
      ? payload.code
      : null
  const reason =
    payload?.reason === 'upgrade_required' ||
    payload?.reason === 'access_expired' ||
    payload?.reason === 'billing_issue' ||
    payload?.reason === 'self_hosted_proxy_unavailable' ||
    payload?.reason === 'auth_required'
      ? payload.reason
      : code === 'auth_required'
        ? 'auth_required'
        : null
  const feature = typeof payload?.feature === 'string' ? (payload.feature as FacetAiFeatureKey) : null

  if (code) {
    return new FacetAiProxyError(
      errorMessage || toErrorText(response.status, 'Hosted AI access was denied.'),
      {
        status: response.status,
        code,
        reason,
        feature,
      },
    )
  }

  if (isBillingIssueMessage(errorMessage)) {
    return new FacetAiProxyError(
      'AI proxy billing issue: the Anthropic account behind the proxy is out of credits. Update Plans & Billing and try again.',
      {
        status: response.status,
        code: 'ai_access_denied',
        reason: 'billing_issue',
        feature: null,
      },
    )
  }

  return new Error(toErrorText(response.status, errorMessage || response.statusText || 'Unknown error'))
}
