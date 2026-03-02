import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ResumeData } from '../types'
import { defaultResumeData } from './defaultData'
import { resolveStorage } from './storage'

const MAX_HISTORY = 50

interface ResumeState {
  data: ResumeData
  past: ResumeData[]
  future: ResumeData[]
  setData: (data: ResumeData) => void
  resetToDefaults: () => void
  undo: () => void
  redo: () => void
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      data: defaultResumeData,
      past: [],
      future: [],
      setData: (data) => {
        const { data: current, past } = get()
        set({
          data,
          past: [...past, current].slice(-MAX_HISTORY),
          future: [],
        })
      },
      resetToDefaults: () => {
        const { data: current, past } = get()
        set({
          data: defaultResumeData,
          past: [...past, current].slice(-MAX_HISTORY),
          future: [],
        })
      },
      undo: () => {
        const { past, data: current, future } = get()
        const previous = past.at(-1)
        if (!previous) return
        set({
          data: previous,
          past: past.slice(0, -1),
          future: [current, ...future].slice(0, MAX_HISTORY),
        })
      },
      redo: () => {
        const { past, data: current, future } = get()
        const next = future.at(0)
        if (!next) return
        set({
          data: next,
          past: [...past, current],
          future: future.slice(1),
        })
      },
    }),
    {
      name: 'vector-resume-data',
      version: 1,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({ data: state.data }),
    },
  ),
)
