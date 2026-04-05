import { jsonrepair } from 'jsonrepair'

export interface ParsedJsonResult<T> {
  data: T
  repaired: boolean
}

export function formatJsonParsingError(context: string, error: unknown): Error {
  const message =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : 'Invalid JSON.'

  return new Error(`${context} contains invalid JSON: ${message}`)
}

export function parseJsonWithRepair<T = unknown>(
  value: string,
  context = 'JSON document',
): ParsedJsonResult<T> {
  try {
    return {
      data: JSON.parse(value) as T,
      repaired: false,
    }
  } catch (error) {
    try {
      return {
        data: JSON.parse(jsonrepair(value)) as T,
        repaired: true,
      }
    } catch {
      throw formatJsonParsingError(context, error)
    }
  }
}
