import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { VariantSelection, VectorSelection } from '../types'
import { resolveStorage } from './storage'

type VectorKey = VectorSelection

type OverrideMap = Record<string, boolean>
type VectorOverrides = Record<VectorKey, OverrideMap>
type VariantMap = Record<string, VariantSelection>
type VectorVariantOverrides = Record<VectorKey, VariantMap>

type RoleOrder = Record<string, string[]>
type VectorBulletOrders = Record<VectorKey, RoleOrder>

export interface UiState {
  selectedVector: VectorSelection
  panelRatio: number
  manualOverrides: VectorOverrides
  variantOverrides: VectorVariantOverrides
  bulletOrders: VectorBulletOrders
  appearance: 'light' | 'dark' | 'system'
  setSelectedVector: (vector: VectorSelection) => void
  setPanelRatio: (ratio: number) => void
  resetAllOverrides: () => void
  setOverride: (vector: VectorKey, componentKey: string, included: boolean | null) => void
  setVariantOverride: (
    vector: VectorKey,
    componentKey: string,
    variant: VariantSelection | null,
  ) => void
  resetOverridesForVector: (vector: VectorKey) => void
  setRoleBulletOrder: (vector: VectorKey, roleId: string, order: string[]) => void
  resetRoleBulletOrder: (vector: VectorKey, roleId: string) => void
  setAppearance: (appearance: 'light' | 'dark' | 'system') => void
}

export const toVectorKey = (selectedVector: VectorSelection): VectorKey => selectedVector

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selectedVector: 'all',
      panelRatio: 0.45,
      manualOverrides: {},
      variantOverrides: {},
      bulletOrders: {},
      appearance: 'system',
      setSelectedVector: (vector) => set({ selectedVector: vector }),
      setPanelRatio: (ratio) => set({ panelRatio: Math.min(0.7, Math.max(0.3, ratio)) }),
      setAppearance: (appearance) => set({ appearance }),
      resetAllOverrides: () =>
        set({
          manualOverrides: {},
          variantOverrides: {},
          bulletOrders: {},
        }),
      setOverride: (vector, componentKey, included) =>
        set((state) => {
          const current = state.manualOverrides[vector] ?? {}
          if (included === null) {
            const next = { ...current }
            delete next[componentKey]
            return {
              manualOverrides: {
                ...state.manualOverrides,
                [vector]: next,
              },
            }
          }

          return {
            manualOverrides: {
              ...state.manualOverrides,
              [vector]: {
                ...current,
                [componentKey]: included,
              },
            },
          }
        }),
      setVariantOverride: (vector, componentKey, variant) =>
        set((state) => {
          const current = state.variantOverrides[vector] ?? {}
          if (variant === null) {
            const next = { ...current }
            delete next[componentKey]
            return {
              variantOverrides: {
                ...state.variantOverrides,
                [vector]: next,
              },
            }
          }

          return {
            variantOverrides: {
              ...state.variantOverrides,
              [vector]: {
                ...current,
                [componentKey]: variant,
              },
            },
          }
        }),
      resetOverridesForVector: (vector) =>
        set((state) => {
          const nextManual = { ...state.manualOverrides }
          delete nextManual[vector]
          const nextVariant = { ...state.variantOverrides }
          delete nextVariant[vector]
          const nextBulletOrders = { ...state.bulletOrders }
          delete nextBulletOrders[vector]
          return {
            manualOverrides: nextManual,
            variantOverrides: nextVariant,
            bulletOrders: nextBulletOrders,
          }
        }),
      setRoleBulletOrder: (vector, roleId, order) =>
        set((state) => ({
          bulletOrders: {
            ...state.bulletOrders,
            [vector]: {
              ...(state.bulletOrders[vector] ?? {}),
              [roleId]: order,
            },
          },
        })),
      resetRoleBulletOrder: (vector, roleId) =>
        set((state) => {
          const currentForVector = state.bulletOrders[vector] ?? {}
          if (!(roleId in currentForVector)) {
            return state
          }

          const nextForVector = { ...currentForVector }
          delete nextForVector[roleId]
          return {
            bulletOrders: {
              ...state.bulletOrders,
              [vector]: nextForVector,
            },
          }
        }),
    }),
    {
      // ⚠️ Keep in sync with index.html inline theme script
      name: 'vector-resume-ui',
      version: 3,
      storage: createJSONStorage(resolveStorage),
    },
  ),
)
