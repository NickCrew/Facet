import type { StateStorage } from 'zustand/middleware'

type MutableStorage = StateStorage & {
  clear?: () => void
}

function createPersistentMemoryStorage(): MutableStorage {
  const store = new Map<string, string>()

  return {
    getItem: (name) => (store.has(name) ? store.get(name) ?? null : null),
    setItem: (name, value) => {
      store.set(name, value)
    },
    removeItem: (name) => {
      store.delete(name)
    },
    clear: () => {
      store.clear()
    },
  }
}

const shimStorage = createPersistentMemoryStorage()

function hasStorageApi(candidate: Partial<MutableStorage> | undefined): candidate is MutableStorage {
  return Boolean(
    candidate &&
      typeof candidate.getItem === 'function' &&
      typeof candidate.setItem === 'function' &&
      typeof candidate.removeItem === 'function',
  )
}

function storagePersists(candidate: MutableStorage): boolean {
  try {
    const probeKey = '__facet-storage-probe__'
    candidate.setItem(probeKey, 'ok')
    const value = candidate.getItem(probeKey)
    candidate.removeItem(probeKey)
    return value === 'ok'
  } catch {
    return false
  }
}

export const ensureLocalStorage = (): MutableStorage => {
  const candidate = globalThis.localStorage as Partial<MutableStorage> | undefined

  if (
    hasStorageApi(candidate) &&
    typeof candidate.clear === 'function' &&
    storagePersists(candidate)
  ) {
    return candidate
  }

  return shimStorage
}

export const resolveStorage = (): StateStorage => ensureLocalStorage()
