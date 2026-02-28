import type { PriorityByVector, ResumeData, VectorSelection } from '../types'

export function defaultVectorsForSelection(
  selectedVector: VectorSelection,
  availableVectors: ResumeData['vectors'],
): PriorityByVector {
  if (selectedVector !== 'all') {
    return { [selectedVector]: 'must' }
  }

  if (availableVectors.length) {
    return Object.fromEntries(availableVectors.map((vector) => [vector.id, 'optional' as const]))
  }

  return {}
}
