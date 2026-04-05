import { create } from 'zustand'
import type { RecruiterCard } from '../types/recruiter'
import {
  ensureDurableMetadata,
  stripDurableMetadataPatch,
  touchDurableMetadata,
} from './durableMetadata'

interface RecruiterState {
  cards: RecruiterCard[]
  selectedCardId: string | null
  addCard: (card: RecruiterCard) => void
  updateCard: (id: string, patch: Partial<RecruiterCard>) => void
  deleteCard: (id: string) => void
  importCards: (cards: RecruiterCard[]) => void
  setSelectedCardId: (id: string | null) => void
}

const now = () => new Date().toISOString()

const normalizeCard = (
  card: RecruiterCard,
  options: { touch?: boolean } = {},
): RecruiterCard => {
  const timestamp = now()

  return {
    ...card,
    durableMeta: options.touch
      ? touchDurableMetadata(card.durableMeta, timestamp)
      : ensureDurableMetadata(card.durableMeta, timestamp),
  }
}

export const useRecruiterStore = create<RecruiterState>()((set) => ({
  cards: [],
  selectedCardId: null,

  addCard: (card) =>
    set((state) => ({
      cards: [normalizeCard(card), ...state.cards],
      selectedCardId: card.id,
    })),

  updateCard: (id, patch) => {
    const restPatch = stripDurableMetadataPatch(patch)
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id
          ? normalizeCard(
              {
                ...card,
                ...restPatch,
              },
              { touch: true },
            )
          : card,
      ),
    }))
  },

  deleteCard: (id) =>
    set((state) => {
      const cards = state.cards.filter((card) => card.id !== id)
      return {
        cards,
        selectedCardId:
          state.selectedCardId === id ? cards[0]?.id ?? null : state.selectedCardId,
      }
    }),

  importCards: (cards) =>
    set({
      cards: cards.map((card) => normalizeCard(card)),
      selectedCardId: cards[0]?.id ?? null,
    }),

  setSelectedCardId: (id) => set({ selectedCardId: id }),
}))
