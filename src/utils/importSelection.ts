import type { ResumeData, VectorSelection } from '../types'

export function resolveSelectedVectorAfterReplaceImport(
  currentSelectedVector: VectorSelection,
  nextVectors: ResumeData['vectors'],
): VectorSelection {
  if (currentSelectedVector === 'all') {
    return 'all'
  }

  return nextVectors.some((vector) => vector.id === currentSelectedVector) ? currentSelectedVector : 'all'
}

export function resolveComparisonVectorAfterReplaceImport(
  comparisonVector: VectorSelection | null,
  nextVectors: ResumeData['vectors'],
): VectorSelection | null {
  if (comparisonVector === null) {
    return null
  }

  if (comparisonVector === 'all') {
    return 'all'
  }

  return nextVectors.some((vector) => vector.id === comparisonVector) ? comparisonVector : null
}
