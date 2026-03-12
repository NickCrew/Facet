import { resolveStorage } from '../store/storage'
import { cloneValue } from './clone'
import type { FacetLocalPreferencesSnapshot } from './contracts'

export interface LocalPreferencesBackend {
  kind: 'indexeddb' | 'localStorage' | 'memory' | 'custom'
  loadLocalPreferencesSnapshot: (
    workspaceId: string,
  ) => Promise<FacetLocalPreferencesSnapshot | null> | FacetLocalPreferencesSnapshot | null
  saveLocalPreferencesSnapshot: (
    snapshot: FacetLocalPreferencesSnapshot,
  ) => Promise<FacetLocalPreferencesSnapshot> | FacetLocalPreferencesSnapshot
  deleteLocalPreferencesSnapshot?: (workspaceId: string) => Promise<void> | void
}

const LOCAL_PREFERENCES_KEY_PREFIX = 'facet-local-preferences:'

const storageKey = (workspaceId: string) => `${LOCAL_PREFERENCES_KEY_PREFIX}${workspaceId}`

export const createInMemoryLocalPreferencesBackend = (): LocalPreferencesBackend => {
  const snapshots = new Map<string, FacetLocalPreferencesSnapshot>()

  return {
    kind: 'memory',
    loadLocalPreferencesSnapshot: (workspaceId) => {
      const existing = snapshots.get(workspaceId)
      return existing ? cloneValue(existing) : null
    },
    saveLocalPreferencesSnapshot: (snapshot) => {
      snapshots.set(snapshot.workspaceId, cloneValue(snapshot))
      return cloneValue(snapshot)
    },
    deleteLocalPreferencesSnapshot: (workspaceId) => {
      snapshots.delete(workspaceId)
    },
  }
}

export const createLocalStorageLocalPreferencesBackend = (): LocalPreferencesBackend => ({
  kind: 'localStorage',
  loadLocalPreferencesSnapshot: (workspaceId) => {
    const storage = resolveStorage()
    const raw = storage.getItem(storageKey(workspaceId))
    if (!raw || raw instanceof Promise) {
      return null
    }

    try {
      return JSON.parse(raw) as FacetLocalPreferencesSnapshot
    } catch {
      return null
    }
  },
  saveLocalPreferencesSnapshot: (snapshot) => {
    const storage = resolveStorage()
    storage.setItem(storageKey(snapshot.workspaceId), JSON.stringify(snapshot))
    return cloneValue(snapshot)
  },
  deleteLocalPreferencesSnapshot: (workspaceId) => {
    resolveStorage().removeItem(storageKey(workspaceId))
  },
})
