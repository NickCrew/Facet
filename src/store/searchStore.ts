import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  SearchInterviewPrefs,
  SearchProfile,
  SearchProfileConstraints,
  SearchProfileFilters,
  SearchRequest,
  SearchRun,
  SkillCatalogEntry,
  VectorSearchConfig,
} from '../types/search'
import { createId } from '../utils/idUtils'
import { resolveStorage } from './storage'

type SearchProfileInput = Omit<SearchProfile, 'id' | 'inferredAt'> &
  Partial<Pick<SearchProfile, 'id' | 'inferredAt'>>

type SearchRequestInput = Omit<SearchRequest, 'id' | 'createdAt'> &
  Partial<Pick<SearchRequest, 'id' | 'createdAt'>>

type SearchRunInput = Omit<SearchRun, 'id' | 'createdAt'> &
  Partial<Pick<SearchRun, 'id' | 'createdAt'>>

interface SearchState {
  profile: SearchProfile | null
  requests: SearchRequest[]
  runs: SearchRun[]

  setProfile: (profile: SearchProfileInput) => SearchProfile
  updateProfileSkills: (skills: SkillCatalogEntry[]) => void
  updateProfileVectors: (vectors: VectorSearchConfig[]) => void
  updateProfileConstraints: (constraints: SearchProfileConstraints) => void
  updateProfileFilters: (filters: SearchProfileFilters) => void
  updateProfileInterviewPrefs: (prefs: SearchInterviewPrefs) => void
  clearProfile: () => void
  addRequest: (request: SearchRequestInput) => SearchRequest
  updateRequest: (id: string, patch: Partial<SearchRequest>) => void
  deleteRequest: (id: string) => void
  addRun: (run: SearchRunInput) => SearchRun
  updateRun: (id: string, patch: Partial<SearchRun>) => void
  deleteRun: (id: string) => void
  getRunsForRequest: (requestId: string) => SearchRun[]
}

const now = () => new Date().toISOString()

const hydrateProfile = (profile: SearchProfileInput): SearchProfile => ({
  ...profile,
  id: profile.id ?? createId('sprof'),
  inferredAt: profile.inferredAt ?? now(),
})

const hydrateRequest = (request: SearchRequestInput): SearchRequest => ({
  ...request,
  id: request.id ?? createId('sreq'),
  createdAt: request.createdAt ?? now(),
})

const hydrateRun = (run: SearchRunInput): SearchRun => ({
  ...run,
  id: run.id ?? createId('srun'),
  createdAt: run.createdAt ?? now(),
})

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      profile: null,
      requests: [],
      runs: [],

      setProfile: (profile) => {
        const hydrated = hydrateProfile(profile)
        set({ profile: hydrated })
        return hydrated
      },

      updateProfileSkills: (skills) => {
        set((state) =>
          state.profile
            ? {
                profile: {
                  ...state.profile,
                  skills,
                },
              }
            : state,
        )
      },

      updateProfileVectors: (vectors) => {
        set((state) =>
          state.profile
            ? {
                profile: {
                  ...state.profile,
                  vectors,
                },
              }
            : state,
        )
      },

      updateProfileConstraints: (constraints) => {
        set((state) =>
          state.profile
            ? {
                profile: {
                  ...state.profile,
                  constraints,
                },
              }
            : state,
        )
      },

      updateProfileFilters: (filters) => {
        set((state) =>
          state.profile
            ? {
                profile: {
                  ...state.profile,
                  filters,
                },
              }
            : state,
        )
      },

      updateProfileInterviewPrefs: (interviewPrefs) => {
        set((state) =>
          state.profile
            ? {
                profile: {
                  ...state.profile,
                  interviewPrefs,
                },
              }
            : state,
        )
      },

      clearProfile: () => {
        set({ profile: null })
      },

      addRequest: (request) => {
        const hydrated = hydrateRequest(request)
        set((state) => ({ requests: [...state.requests, hydrated] }))
        return hydrated
      },

      updateRequest: (id, patch) => {
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === id ? { ...request, ...patch } : request,
          ),
        }))
      },

      deleteRequest: (id) => {
        set((state) => ({
          requests: state.requests.filter((request) => request.id !== id),
          runs: state.runs.filter((run) => run.requestId !== id),
        }))
      },

      addRun: (run) => {
        const hydrated = hydrateRun(run)
        set((state) => ({ runs: [...state.runs, hydrated] }))
        return hydrated
      },

      updateRun: (id, patch) => {
        set((state) => ({
          runs: state.runs.map((run) => (run.id === id ? { ...run, ...patch } : run)),
        }))
      },

      deleteRun: (id) => {
        set((state) => ({ runs: state.runs.filter((run) => run.id !== id) }))
      },

      getRunsForRequest: (requestId) =>
        get().runs.filter((run) => run.requestId === requestId),
    }),
    {
      name: 'facet-search-data',
      version: 1,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        profile: state.profile,
        requests: state.requests,
        runs: state.runs,
      }),
    },
  ),
)
