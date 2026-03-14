interface FacetApiErrorPayload {
  error?: unknown
  code?: unknown
  reason?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export class FacetApiError extends Error {
  status: number
  code: string | null
  reason: string | null

  constructor(
    message: string,
    options: {
      status: number
      code?: string | null
      reason?: string | null
    },
  ) {
    super(message)
    this.name = 'FacetApiError'
    this.status = options.status
    this.code = options.code ?? null
    this.reason = options.reason ?? null
  }
}

const toErrorText = (status: number, fallback: string) => {
  const message = fallback.trim()
  return `${message.slice(0, 160)}${status > 0 ? ` (${status})` : ''}`
}

export function isFacetApiError(error: unknown): error is FacetApiError {
  return (
    error instanceof FacetApiError ||
    (isRecord(error) &&
      error.name === 'FacetApiError' &&
      typeof error.status === 'number' &&
      ('code' in error ? typeof error.code === 'string' || error.code === null : true))
  )
}

export async function readFacetApiError(
  response: Response,
  fallbackMessage: string,
): Promise<FacetApiError> {
  const text = await response.text()
  let parsed: unknown = null

  if (text.trim()) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = null
    }
  }

  const payload = isRecord(parsed) ? (parsed as FacetApiErrorPayload) : null
  const message =
    payload && typeof payload.error === 'string' && payload.error.trim()
      ? payload.error.trim()
      : text.trim() || fallbackMessage
  const code =
    payload && typeof payload.code === 'string'
      ? payload.code
      : response.status === 401 || response.status === 403
        ? 'auth_required'
        : null
  const reason = payload && typeof payload.reason === 'string' ? payload.reason : null

  return new FacetApiError(toErrorText(response.status, message), {
    status: response.status,
    code,
    reason,
  })
}

export function toFacetApiError(
  error: unknown,
  fallbackMessage: string,
): Error {
  if (error instanceof FacetApiError) {
    return error
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new FacetApiError('The request timed out while contacting Facet.', {
      status: 0,
      code: 'offline',
    })
  }

  if (error instanceof TypeError) {
    return new FacetApiError('Facet could not reach the network. Check your connection and retry.', {
      status: 0,
      code: 'offline',
    })
  }

  return error instanceof Error ? error : new Error(fallbackMessage)
}
