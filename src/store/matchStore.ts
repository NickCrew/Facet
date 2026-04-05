import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { MatchHistoryEntry, MatchReport } from '../types/match'
import { createMatchHistoryEntry } from '../utils/jobMatch'
import { resolveStorage } from './storage'

interface MatchState {
  jobDescription: string
  currentReport: MatchReport | null
  warnings: string[]
  history: MatchHistoryEntry[]
  setJobDescription: (value: string) => void
  setReport: (report: MatchReport) => void
  clearReport: () => void
}

const appendHistory = (
  history: MatchHistoryEntry[],
  entry: MatchHistoryEntry,
): MatchHistoryEntry[] => [entry, ...history].slice(0, 10)

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      jobDescription: '',
      currentReport: null,
      warnings: [],
      history: [],
      setJobDescription: (value) => set({ jobDescription: value }),
      setReport: (report) =>
        set((state) => ({
          currentReport: report,
          warnings: report.warnings,
          history: appendHistory(state.history, createMatchHistoryEntry(report)),
        })),
      clearReport: () => set({ currentReport: null, warnings: [] }),
    }),
    {
      name: 'facet-match-workspace',
      version: 1,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        jobDescription: state.jobDescription,
        currentReport: state.currentReport,
        warnings: state.warnings,
        history: state.history,
      }),
    },
  ),
)
