import { create } from 'zustand'

interface HandoffState {
  pendingJd: string | null
  pendingVectorId: string | null
  sourceEntryId: string | null
  setPendingAnalysis: (jd: string, vectorId?: string | null, entryId?: string | null) => void
  consume: () => { jd: string; vectorId: string | null; entryId: string | null } | null
}

export const useHandoffStore = create<HandoffState>()((set, get) => ({
  pendingJd: null,
  pendingVectorId: null,
  sourceEntryId: null,

  setPendingAnalysis: (jd, vectorId = null, entryId = null) => {
    set({ pendingJd: jd, pendingVectorId: vectorId, sourceEntryId: entryId })
  },

  consume: () => {
    const { pendingJd, pendingVectorId, sourceEntryId } = get()
    if (!pendingJd) return null
    set({ pendingJd: null, pendingVectorId: null, sourceEntryId: null })
    return { jd: pendingJd, vectorId: pendingVectorId, entryId: sourceEntryId }
  },
}))
