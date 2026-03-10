import { describe, it, expect } from 'vitest'
import { resolveDisplayText } from '../utils/resolveDisplayText'

describe('resolveDisplayText', () => {
  const baseText = 'Base text'
  const variants = {
    backend: 'Backend variant',
    security: 'Security variant',
  }

  it('returns base text when selectedVector is "all"', () => {
    expect(resolveDisplayText(baseText, variants, 'all')).toBe(baseText)
  })

  it('returns base text when no variants exist', () => {
    expect(resolveDisplayText(baseText, undefined, 'backend')).toBe(baseText)
  })

  it('returns base text when variants is empty object', () => {
    expect(resolveDisplayText(baseText, {}, 'backend')).toBe(baseText)
  })

  it('returns variant text when selectedVector matches', () => {
    expect(resolveDisplayText(baseText, variants, 'backend')).toBe('Backend variant')
  })

  it('returns base text when selectedVector has no variant', () => {
    expect(resolveDisplayText(baseText, variants, 'devops')).toBe(baseText)
  })

  it('returns correct variant for each vector', () => {
    expect(resolveDisplayText(baseText, variants, 'security')).toBe('Security variant')
  })
})
