import { create } from 'zustand'
import { useCoverLetterStore } from '../store/coverLetterStore'
import { usePipelineStore } from '../store/pipelineStore'
import { usePrepStore } from '../store/prepStore'
import { useResumeStore } from '../store/resumeStore'
import { useSearchStore } from '../store/searchStore'
import { useUiStore } from '../store/uiStore'
import { DEFAULT_LOCAL_WORKSPACE_ID, DEFAULT_LOCAL_WORKSPACE_NAME } from './contracts'
import {
  createPersistenceCoordinator,
  type PersistenceBackend,
  type PersistenceStatus,
} from './coordinator'
import {
  applyLocalPreferencesSnapshotToStores,
  applyWorkspaceSnapshotToStores,
  hydrateStoresFromLegacyStorage,
} from './hydration'
import {
  createDefaultWorkspacePersistenceBackend,
  createIndexedDbLocalPreferencesBackend,
} from './indexedDb'
import {
  createLocalStorageLocalPreferencesBackend,
  type LocalPreferencesBackend,
} from './localPreferences'
import {
  createLocalPreferencesSnapshotFromStores,
  createWorkspaceSnapshotFromStores,
} from './snapshot'

const DEFAULT_SAVE_DEBOUNCE_MS = 150

export interface PersistenceRuntimeState {
  hydrated: boolean
  usingLegacyMigration: boolean
  status: PersistenceStatus
}

const defaultStatus = (backend: PersistenceBackend['kind']): PersistenceStatus => ({
  phase: 'idle',
  backend,
  activeWorkspaceId: DEFAULT_LOCAL_WORKSPACE_ID,
  lastHydratedAt: null,
  lastSavedAt: null,
  lastError: null,
})

export const usePersistenceRuntimeStore = create<PersistenceRuntimeState>(() => ({
  hydrated: false,
  usingLegacyMigration: false,
  status: defaultStatus('memory'),
}))

export interface PersistenceRuntimeOptions {
  workspaceId?: string
  workspaceName?: string
  saveDebounceMs?: number
  backend?: PersistenceBackend
  localPreferencesBackend?: LocalPreferencesBackend
}

export interface PersistenceRuntime {
  start: () => Promise<void>
  flush: () => Promise<void>
  dispose: () => void
}

const createDefaultLocalPreferencesBackend = (): LocalPreferencesBackend => {
  if (typeof globalThis.indexedDB !== 'undefined') {
    return createIndexedDbLocalPreferencesBackend()
  }

  return createLocalStorageLocalPreferencesBackend()
}

export const createPersistenceRuntime = (
  options: PersistenceRuntimeOptions = {},
): PersistenceRuntime => {
  const workspaceId = options.workspaceId ?? DEFAULT_LOCAL_WORKSPACE_ID
  const workspaceName = options.workspaceName ?? DEFAULT_LOCAL_WORKSPACE_NAME
  const backend = options.backend ?? createDefaultWorkspacePersistenceBackend()
  const localPreferencesBackend =
    options.localPreferencesBackend ?? createDefaultLocalPreferencesBackend()
  const coordinator = createPersistenceCoordinator({
    backend,
    readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
  })

  let started = false
  let starting: Promise<void> | null = null
  let disposed = false
  let suppressSaves = false
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let subscriptions: Array<() => void> = []

  const syncRuntimeState = (patch: Partial<PersistenceRuntimeState>) => {
    usePersistenceRuntimeStore.setState((state) => ({
      ...state,
      ...patch,
    }))
  }

  const syncStatusFromCoordinator = () => {
    syncRuntimeState({
      status: coordinator.getStatus(),
    })
  }

  const clearSaveTimer = () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  }

  const persistCurrentState = async () => {
    if (disposed) {
      return
    }

    clearSaveTimer()

    const currentSnapshot = await coordinator.exportWorkspaceSnapshot({
      workspaceId,
      workspaceName,
    })
    // Saving reuses the coordinator's validation and status flow but does not
    // rehydrate Zustand stores; store writes continue to flow one-way into the
    // persistence runtime.
    await coordinator.importWorkspaceSnapshot(currentSnapshot, { mode: 'replace' })
    syncStatusFromCoordinator()

    await localPreferencesBackend.saveLocalPreferencesSnapshot(
      createLocalPreferencesSnapshotFromStores(workspaceId),
    )
  }

  const schedulePersist = () => {
    if (!started || suppressSaves || disposed) {
      return
    }

    clearSaveTimer()
    saveTimer = setTimeout(() => {
      void persistCurrentState().catch((error) => {
        syncRuntimeState({
          status: {
            ...coordinator.getStatus(),
            phase: 'error',
            lastError:
              error instanceof Error ? error.message : 'Failed to persist workspace runtime',
          },
        })
      })
    }, options.saveDebounceMs ?? DEFAULT_SAVE_DEBOUNCE_MS)
  }

  const installSubscriptions = () => {
    subscriptions = [
      useResumeStore.subscribe(() => schedulePersist()),
      usePipelineStore.subscribe(() => schedulePersist()),
      usePrepStore.subscribe(() => schedulePersist()),
      useCoverLetterStore.subscribe(() => schedulePersist()),
      useSearchStore.subscribe(() => schedulePersist()),
      useUiStore.subscribe(() => schedulePersist()),
    ]
  }

  const runtime: PersistenceRuntime = {
    start: async () => {
      if (started) {
        return
      }

      if (starting) {
        return starting
      }

      starting = (async () => {
        syncRuntimeState({
          hydrated: false,
          usingLegacyMigration: false,
          status: defaultStatus(backend.kind),
        })

        suppressSaves = true
        let usedLegacyMigration = false

        try {
          const { snapshot } = await coordinator.bootstrap(workspaceId)
          syncStatusFromCoordinator()

          if (snapshot) {
            applyWorkspaceSnapshotToStores(snapshot)
            const localPreferences =
              await localPreferencesBackend.loadLocalPreferencesSnapshot(workspaceId)
            if (localPreferences) {
              applyLocalPreferencesSnapshotToStores(localPreferences)
            }
          } else {
            usedLegacyMigration = hydrateStoresFromLegacyStorage()
            if (usedLegacyMigration) {
              await persistCurrentState()
            }
          }

          started = true
          installSubscriptions()
          syncRuntimeState({
            hydrated: true,
            usingLegacyMigration: usedLegacyMigration,
            status: coordinator.getStatus(),
          })
        } catch (error) {
          syncRuntimeState({
            hydrated: true,
            status: {
              ...coordinator.getStatus(),
              phase: 'error',
              lastError:
                error instanceof Error ? error.message : 'Failed to bootstrap persistence runtime',
            },
          })
          throw error
        } finally {
          suppressSaves = false
          starting = null
        }
      })()

      return starting
    },

    flush: async () => {
      await (starting ?? (started ? Promise.resolve() : runtime.start()))
      await persistCurrentState()
    },

    dispose: () => {
      disposed = true
      clearSaveTimer()
      subscriptions.forEach((unsubscribe) => unsubscribe())
      subscriptions = []
      started = false
      starting = null
      if (runtimeSingleton === runtime) {
        runtimeSingleton = null
      }
    },
  }

  return runtime
}

let runtimeSingleton: PersistenceRuntime | null = null

export const getPersistenceRuntime = (): PersistenceRuntime => {
  if (!runtimeSingleton) {
    runtimeSingleton = createPersistenceRuntime()
  }

  return runtimeSingleton
}
