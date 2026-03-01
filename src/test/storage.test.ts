// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { resolveStorage } from '../store/storage'

describe('resolveStorage', () => {
  it('returns localStorage when available', () => {
    const storage = resolveStorage()
    // In jsdom, localStorage is available
    expect(storage.getItem).toBeTypeOf('function')
    expect(storage.setItem).toBeTypeOf('function')
    expect(storage.removeItem).toBeTypeOf('function')
    // Verify it's actually localStorage, not the fallback
    storage.setItem('__test__', 'value')
    expect(storage.getItem('__test__')).toBe('value')
    storage.removeItem('__test__')
    expect(storage.getItem('__test__')).toBeNull()
  })

  it('returns in-memory fallback when localStorage is missing', () => {
    const original = globalThis.localStorage
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const storage = resolveStorage()
      expect(storage.getItem('anything')).toBeNull()
      // setItem and removeItem should not throw
      storage.setItem('key', 'value')
      storage.removeItem('key')
      // getItem still returns null (not persisted)
      expect(storage.getItem('key')).toBeNull()
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        value: original,
        writable: true,
        configurable: true,
      })
    }
  })

  it('returns in-memory fallback when localStorage has incomplete API', () => {
    const original = globalThis.localStorage
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        value: { getItem: () => null },
        writable: true,
        configurable: true,
      })

      const storage = resolveStorage()
      // Should fall back to memoryStorage since setItem/removeItem are missing
      expect(storage.getItem('anything')).toBeNull()
      storage.setItem('key', 'value')
      expect(storage.getItem('key')).toBeNull()
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        value: original,
        writable: true,
        configurable: true,
      })
    }
  })
})
