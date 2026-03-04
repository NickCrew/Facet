import type { TextVariantMap, VariantSelection, VectorSelection } from '../types'

export interface DisplayTextResult {
  displayText: string
  activeVariantId: string | null
}

/**
 * Resolves the text that should be displayed in a textarea,
 * matching the assembler's variant resolution logic.
 */
export function resolveDisplayText(
  baseText: string,
  variants: TextVariantMap | undefined,
  selectedVariant: VariantSelection | undefined,
  selectedVector: VectorSelection,
): DisplayTextResult {
  // Explicit 'default' override → always base text
  if (selectedVariant === 'default') {
    return { displayText: baseText, activeVariantId: null }
  }

  // Explicit variant override pointing to an existing variant
  if (selectedVariant && selectedVariant !== 'default' && variants?.[selectedVariant]) {
    return { displayText: variants[selectedVariant], activeVariantId: selectedVariant }
  }

  // Auto-select: vector-specific variant when not viewing 'all'
  if (selectedVector !== 'all' && variants?.[selectedVector]) {
    return { displayText: variants[selectedVector], activeVariantId: selectedVector }
  }

  // Fallback → base text
  return { displayText: baseText, activeVariantId: null }
}
