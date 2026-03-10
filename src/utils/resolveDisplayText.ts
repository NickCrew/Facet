import type { TextVariantMap, VectorSelection } from '../types'

/**
 * Resolves the text that should be displayed in a textarea.
 * With implicit variant editing: viewing a specific vector shows
 * that vector's variant if it exists, otherwise base text.
 */
export function resolveDisplayText(
  baseText: string,
  variants: TextVariantMap | undefined,
  selectedVector: VectorSelection,
): string {
  if (selectedVector !== 'all' && variants?.[selectedVector]) {
    return variants[selectedVector]
  }

  return baseText
}
