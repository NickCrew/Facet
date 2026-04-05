import { describe, expect, it } from 'vitest'
import { parseJsonWithRepair } from '../utils/jsonParsing'

describe('jsonParsing', () => {
  it('repairs missing commas between array elements', () => {
    const parsed = parseJsonWithRepair<{ items: string[] }>(
      '{ "items": ["alpha" "beta"] }',
      'Draft identity document',
    )

    expect(parsed.repaired).toBe(true)
    expect(parsed.data).toEqual({ items: ['alpha', 'beta'] })
  })

  it('adds context to unrecoverable parse errors', () => {
    expect(() => parseJsonWithRepair('{ "items": [1, 2 } {', 'Draft identity document')).toThrow(
      'Draft identity document contains invalid JSON:',
    )
  })
})
