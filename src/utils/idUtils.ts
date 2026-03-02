export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createId(prefix: string) {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) {
    return `${prefix}-${uuid}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * Validates and sanitizes a JD analysis endpoint URL.
 * Rejects URLs with embedded credentials and non-HTTP(S) protocols.
 * @param raw The raw URL string from environment variables or input.
 * @returns A valid URL string, or an empty string if invalid/unsafe.
 */
export function sanitizeEndpointUrl(raw: string | undefined): string {
  if (!raw) {
    return ''
  }

  try {
    const url = new URL(raw)
    // Security check: No embedded credentials
    if (url.username || url.password) {
      return ''
    }
    // Security check: Only http or https
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return ''
    }
    return url.toString()
  } catch {
    return ''
  }
}
