export function reorderById<T extends { id: string }>(items: T[], order: string[] | undefined): T[] {
  if (!order || order.length === 0) {
    return items
  }

  const indexById = new Map(order.map((id, index) => [id, index]))
  return [...items].sort((left, right) => {
    const leftIndex = indexById.get(left.id)
    const rightIndex = indexById.get(right.id)

    if (leftIndex === undefined && rightIndex === undefined) {
      return 0
    }

    if (leftIndex === undefined) {
      return 1
    }

    if (rightIndex === undefined) {
      return -1
    }

    return leftIndex - rightIndex
  })
}
