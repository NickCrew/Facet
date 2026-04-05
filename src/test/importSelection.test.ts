import { describe, expect, it } from 'vitest'
import { resolveComparisonVectorAfterReplaceImport, resolveSelectedVectorAfterReplaceImport } from '../utils/importSelection'
import type { ResumeData } from '../types'

const vectors: ResumeData['vectors'] = [
  { id: 'backend', label: 'Backend', color: '#2563EB' },
  { id: 'platform', label: 'Platform', color: '#0D9488' },
]

describe('importSelection', () => {
  it('preserves all selection across replace imports', () => {
    expect(resolveSelectedVectorAfterReplaceImport('all', vectors)).toBe('all')
  })

  it('preserves selected vectors that still exist after replace import', () => {
    expect(resolveSelectedVectorAfterReplaceImport('backend', vectors)).toBe('backend')
  })

  it('falls back to all when the selected vector disappears after replace import', () => {
    expect(resolveSelectedVectorAfterReplaceImport('leadership', vectors)).toBe('all')
  })

  it('preserves comparison vectors that still exist after replace import', () => {
    expect(resolveComparisonVectorAfterReplaceImport('platform', vectors)).toBe('platform')
  })

  it('preserves all comparison mode across replace imports', () => {
    expect(resolveComparisonVectorAfterReplaceImport('all', vectors)).toBe('all')
  })

  it('clears comparison vectors that disappear after replace import', () => {
    expect(resolveComparisonVectorAfterReplaceImport('leadership', vectors)).toBeNull()
  })
})
