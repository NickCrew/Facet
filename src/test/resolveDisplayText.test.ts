import { describe, it, expect } from 'vitest'
import { resolveDisplayText } from '../utils/resolveDisplayText'

describe('resolveDisplayText', () => {
  const baseText = 'Base text'
  const variants = {
    backend: 'Backend variant',
    security: 'Security variant',
  }

  it('returns base text when selectedVector is "all"', () => {
    const result = resolveDisplayText(baseText, variants, undefined, 'all')
    expect(result).toEqual({ displayText: baseText, activeVariantId: null })
  })

  it('returns base text when no variants exist', () => {
    const result = resolveDisplayText(baseText, undefined, undefined, 'backend')
    expect(result).toEqual({ displayText: baseText, activeVariantId: null })
  })

  it('returns base text when variants is empty object', () => {
    const result = resolveDisplayText(baseText, {}, undefined, 'backend')
    expect(result).toEqual({ displayText: baseText, activeVariantId: null })
  })

  it('auto-selects variant when selectedVector matches', () => {
    const result = resolveDisplayText(baseText, variants, undefined, 'backend')
    expect(result).toEqual({ displayText: 'Backend variant', activeVariantId: 'backend' })
  })

  it('respects "default" override to force base text', () => {
    const result = resolveDisplayText(baseText, variants, 'default', 'backend')
    expect(result).toEqual({ displayText: baseText, activeVariantId: null })
  })

  it('respects explicit variant override', () => {
    const result = resolveDisplayText(baseText, variants, 'security', 'backend')
    expect(result).toEqual({ displayText: 'Security variant', activeVariantId: 'security' })
  })

  it('falls back to base text when override points to nonexistent variant', () => {
    const result = resolveDisplayText(baseText, variants, 'frontend', 'backend')
    // Override points to 'frontend' which doesn't exist, so falls through to auto-select
    // Auto-select finds 'backend' variant
    expect(result).toEqual({ displayText: 'Backend variant', activeVariantId: 'backend' })
  })

  it('falls back to base text when override and auto-select both miss', () => {
    const result = resolveDisplayText(baseText, variants, 'frontend', 'devops')
    expect(result).toEqual({ displayText: baseText, activeVariantId: null })
  })

  it('returns base text when selectedVector is "all" even with variant override', () => {
    // 'default' override checked first, but if override is a specific variant and vector is 'all'
    const result = resolveDisplayText(baseText, variants, 'backend', 'all')
    // Explicit override to 'backend' which exists → returns it even with 'all'
    expect(result).toEqual({ displayText: 'Backend variant', activeVariantId: 'backend' })
  })
})
