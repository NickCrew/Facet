import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DebriefSession } from '../types/debrief'
import { resolveStorage } from './storage'

interface DebriefState {
  sessions: DebriefSession[]
  selectedSessionId: string | null
  addSession: (session: DebriefSession) => void
  updateSession: (id: string, patch: Partial<DebriefSession>) => void
  deleteSession: (id: string) => void
  setSelectedSessionId: (id: string | null) => void
}

export const migrateDebriefState = (persistedState: unknown) => {
  const state =
    typeof persistedState === 'object' && persistedState !== null
      ? (persistedState as {
          sessions?: DebriefSession[]
          selectedSessionId?: string | null
        })
      : undefined

  const sessions = Array.isArray(state?.sessions) ? state.sessions : []

  return {
    ...state,
    sessions,
    selectedSessionId: state?.selectedSessionId ?? sessions[0]?.id ?? null,
  }
}

export const useDebriefStore = create<DebriefState>()(
  persist(
    (set) => ({
      sessions: [],
      selectedSessionId: null,
      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
          selectedSessionId: session.id,
        })),
      updateSession: (id, patch) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...patch } : session,
          ),
        })),
      deleteSession: (id) =>
        set((state) => {
          const sessions = state.sessions.filter((session) => session.id !== id)
          return {
            sessions,
            selectedSessionId:
              state.selectedSessionId === id ? sessions[0]?.id ?? null : state.selectedSessionId,
          }
        }),
      setSelectedSessionId: (id) => set({ selectedSessionId: id }),
    }),
    {
      name: 'facet-debrief-workspace',
      version: 1,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        selectedSessionId: state.selectedSessionId,
      }),
    },
  ),
)

