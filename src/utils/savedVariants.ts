import type {
  ResumeThemeState,
  SavedVariant,
  SavedVariantOverrides,
  VectorSelection,
} from '../types'

const sortObject = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sortObject(item))
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, sortObject(record[key])]),
    )
  }
  return value
}

const stableStringify = (value: unknown): string => JSON.stringify(sortObject(value))

export const createVariantOverridesSnapshot = (
  manualOverrides: Record<string, boolean>,
  variantOverrides: Record<string, SavedVariant['overrides']['variantOverrides'][string]>,
  bulletOrders: Record<string, string[]>,
  theme: ResumeThemeState | undefined,
): SavedVariantOverrides => ({
  manualOverrides: { ...manualOverrides },
  variantOverrides: { ...variantOverrides },
  bulletOrders: Object.fromEntries(
    Object.entries(bulletOrders).map(([roleId, order]) => [roleId, [...order]]),
  ),
  theme: theme
    ? {
        preset: theme.preset,
        ...(theme.overrides ? { overrides: { ...theme.overrides } } : {}),
      }
    : undefined,
})

export const areVariantOverridesEqual = (
  left: SavedVariantOverrides,
  right: SavedVariantOverrides,
): boolean => stableStringify(left) === stableStringify(right)

export const createSavedVariant = (
  id: string,
  name: string,
  description: string,
  baseVector: VectorSelection,
  overrides: SavedVariantOverrides,
  createdAt = new Date().toISOString(),
): SavedVariant => ({
  id,
  name,
  description: description.trim().length > 0 ? description.trim() : undefined,
  createdAt,
  updatedAt: new Date().toISOString(),
  baseVector,
  overrides,
})
