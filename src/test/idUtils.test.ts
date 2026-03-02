import { describe, expect, it, vi } from 'vitest'
import { createId, sanitizeEndpointUrl, slugify } from '../utils/idUtils'

describe('idUtils', () => {
  describe('slugify', () => {
    it('lowercases and trims', () => {
      expect(slugify('  Hello World  ')).toBe('hello-world')
    })

    it('replaces non-alphanumeric with hyphens', () => {
      expect(slugify('Hello! @World# 123')).toBe('hello-world-123')
    })

    it('strips leading and trailing hyphens', () => {
      expect(slugify('---hello---')).toBe('hello')
    })

    it('returns empty string for non-alphanumeric only', () => {
      expect(slugify('!!!')).toBe('')
      expect(slugify('   ')).toBe('')
    })
  })

  describe('createId', () => {
    it('produces prefixed uuid when crypto is available', () => {
      const mockUuid = '1234-5678'
      vi.stubGlobal('crypto', {
        randomUUID: () => mockUuid
      })
      
      expect(createId('test')).toBe(`test-${mockUuid}`)
      vi.unstubAllGlobals()
    })

    it('falls back when crypto is unavailable', () => {
      vi.stubGlobal('crypto', {}) // No randomUUID
      
      const id = createId('test')
      expect(id).toMatch(/^test-\d+-[a-f0-9]+$/)
      vi.unstubAllGlobals()
    })
  })

  describe('sanitizeEndpointUrl', () => {
    it('accepts valid https and http URLs', () => {
      expect(sanitizeEndpointUrl('https://api.example.com')).toBe('https://api.example.com/')
      expect(sanitizeEndpointUrl('http://localhost:3000')).toBe('http://localhost:3000/')
    })

    it('rejects URLs with credentials', () => {
      expect(sanitizeEndpointUrl('https://user:pass@api.example.com')).toBe('')
    })

    it('rejects non-http protocols', () => {
      expect(sanitizeEndpointUrl('ftp://api.example.com')).toBe('')
      expect(sanitizeEndpointUrl('javascript:alert(1)')).toBe('')
      expect(sanitizeEndpointUrl('data:text/plain,hello')).toBe('')
    })

    it('returns empty string for invalid URL strings', () => {
      expect(sanitizeEndpointUrl('not-a-url')).toBe('')
      expect(sanitizeEndpointUrl('')).toBe('')
      expect(sanitizeEndpointUrl(undefined)).toBe('')
    })
  })
})
