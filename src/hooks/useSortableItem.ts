import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function useSortableItem(id: string) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return {
    setNodeRef,
    style,
    dragHandleProps: {
      ...attributes,
      ...listeners,
    },
    isDragging,
  }
}
