import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { VectorSelection } from '../types'
import { resolveStorage } from './storage'

type VectorKey = VectorSelection

export interface UiState {
  selectedVector: VectorSelection
  panelRatio: number
  appearance: 'light' | 'dark' | 'system'
  viewMode: 'pdf' | 'live'
  showHeatmap: boolean
  showDesignHealth: boolean
  setSelectedVector: (vector: VectorSelection) => void
  setPanelRatio: (ratio: number) => void
  setAppearance: (appearance: 'light' | 'dark' | 'system') => void
  setViewMode: (mode: 'pdf' | 'live') => void
  setShowHeatmap: (show: boolean) => void
  setShowDesignHealth: (show: boolean) => void
}

export const toVectorKey = (selectedVector: VectorSelection): VectorKey => selectedVector

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selectedVector: 'all',
      panelRatio: 0.45,
      appearance: 'system',
      viewMode: 'pdf',
      showHeatmap: false,
      showDesignHealth: false,
      setSelectedVector: (vector) => set({ selectedVector: vector }),
      setPanelRatio: (ratio) => set({ panelRatio: Math.min(0.7, Math.max(0.3, ratio)) }),
      setAppearance: (appearance) => set({ appearance }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setShowHeatmap: (show) => set({ showHeatmap: show }),
      setShowDesignHealth: (show) => set({ showDesignHealth: show }),
    }),
    {
      // ⚠️ Keep in sync with index.html inline theme script
      name: 'vector-resume-ui',
      version: 4,
      storage: createJSONStorage(resolveStorage),
      migrate: (persistedState: unknown) => {
        // We're versioning purely to force cleanup of old override data
        // that moved to resumeStore, but we want to keep current UI preferences
        // if they are compatible.
        return persistedState
      },
    },
  ),
)
