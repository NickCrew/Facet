import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useState } from 'react'
import type { ComponentPriority, SkillGroup, SkillGroupVectorConfig, VectorDef } from '../types'
import { ensureSkillGroupVectors } from '../utils/skillGroupVectors'

interface SkillGroupListProps {
  skillGroups: SkillGroup[]
  vectorDefs: VectorDef[]
  onReorder: (nextOrder: string[]) => void
  onUpdate: (skillGroupId: string, field: 'label' | 'content', value: string) => void
  onUpdateVectors: (skillGroupId: string, vectors: Record<string, SkillGroupVectorConfig>) => void
}

interface SortableSkillGroupCardProps {
  skillGroup: SkillGroup
  vectorDefs: VectorDef[]
  onUpdate: (field: 'label' | 'content', value: string) => void
  onUpdateVectors: (vectors: Record<string, SkillGroupVectorConfig>) => void
}

function SortableSkillGroupCard({
  skillGroup,
  vectorDefs,
  onUpdate,
  onUpdateVectors,
}: SortableSkillGroupCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: skillGroup.id })
  const normalizedVectors = ensureSkillGroupVectors(skillGroup, vectorDefs)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <article className="component-card" ref={setNodeRef} style={style}>
      <header className="component-card-header">
        <div className="bullet-title-row">
          <button
            className="drag-handle"
            type="button"
            aria-label="Reorder skill group"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </button>
          <h4>Skill Group</h4>
        </div>
      </header>
      <input
        className="component-input compact"
        aria-label="Skill group name"
        value={skillGroup.label}
        onChange={(event) => onUpdate('label', event.target.value)}
      />
      <textarea
        className="component-input"
        aria-label="Default skill group content"
        value={skillGroup.content}
        onChange={(event) => onUpdate('content', event.target.value)}
      />
      <div className="skill-vector-grid">
        {vectorDefs.map((vector) => {
          const config = normalizedVectors[vector.id]
          return (
            <div className="skill-vector-card" key={vector.id}>
              <div className="skill-vector-heading">
                <span className="vector-dot" style={{ ['--vector-color' as string]: vector.color }} />
                <strong>{vector.label}</strong>
              </div>
              <label className="field-label">
                Priority
                <select
                  className="component-input compact"
                  value={config.priority}
                  onChange={(event) => {
                    const nextPriority = event.target.value as ComponentPriority
                    onUpdateVectors({
                      ...normalizedVectors,
                      [vector.id]: {
                        ...config,
                        priority: nextPriority,
                      },
                    })
                  }}
                >
                  <option value="must">must</option>
                  <option value="strong">strong</option>
                  <option value="optional">optional</option>
                  <option value="exclude">exclude</option>
                </select>
              </label>
              <label className="field-label">
                Order
                <input
                  className="component-input compact"
                  type="number"
                  min={1}
                  value={config.order}
                  onChange={(event) => {
                    const nextOrder = Math.max(1, Number.parseInt(event.target.value || '1', 10) || 1)
                    onUpdateVectors({
                      ...normalizedVectors,
                      [vector.id]: {
                        ...config,
                        order: nextOrder,
                      },
                    })
                  }}
                />
              </label>
              <label className="field-label">
                Vector Content Override
                <textarea
                  className="component-input"
                  placeholder={skillGroup.content}
                  value={config.content ?? ''}
                  onChange={(event) =>
                    onUpdateVectors({
                      ...normalizedVectors,
                      [vector.id]: {
                        ...config,
                        content: event.target.value.trim().length > 0 ? event.target.value : undefined,
                      },
                    })
                  }
                />
              </label>
            </div>
          )
        })}
      </div>
    </article>
  )
}

export function SkillGroupList({
  skillGroups,
  vectorDefs,
  onReorder,
  onUpdate,
  onUpdateVectors,
}: SkillGroupListProps) {
  const skillIds = skillGroups.map((skill) => skill.id)
  const [announcement, setAnnouncement] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const getPosition = (id: string | number) => skillIds.indexOf(String(id)) + 1

  const handleDragStart = (event: { active: { id: string | number } }) => {
    setAnnouncement(`Picked up skill group ${getPosition(event.active.id)}.`)
  }

  const handleDragCancel = () => {
    setAnnouncement('Skill group move canceled.')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = skillIds.indexOf(String(active.id))
    const newIndex = skillIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) {
      return
    }
    onReorder(arrayMove(skillIds, oldIndex, newIndex))
    setAnnouncement(`Dropped skill group at position ${newIndex + 1}.`)
  }

  return (
    <>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={skillIds} strategy={verticalListSortingStrategy}>
          <div className="library-grid">
            {skillGroups.map((skillGroup) => (
              <SortableSkillGroupCard
                key={skillGroup.id}
                skillGroup={skillGroup}
                vectorDefs={vectorDefs}
                onUpdate={(field, value) => onUpdate(skillGroup.id, field, value)}
                onUpdateVectors={(vectors) => onUpdateVectors(skillGroup.id, vectors)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  )
}
