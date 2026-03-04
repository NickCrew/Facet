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
import { GripVertical, Settings, Eye, EyeOff, X } from 'lucide-react'
import { useState } from 'react'
import type { ComponentPriority, SkillGroup, SkillGroupVectorConfig, VectorDef, VectorSelection } from '../types'
import { ensureSkillGroupVectors } from '../utils/skillGroupVectors'

interface SkillGroupListProps {
  skillGroups: SkillGroup[]
  vectorDefs: VectorDef[]
  selectedVector: VectorSelection
  includedByKey: Record<string, boolean>
  onReorder: (nextOrder: string[]) => void
  onUpdate: (skillGroupId: string, field: 'label' | 'content', value: string) => void
  onUpdateVectors: (skillGroupId: string, vectors: Record<string, SkillGroupVectorConfig>) => void
  onToggleIncluded: (skillGroupId: string) => void
}

interface SortableSkillGroupCardProps {
  skillGroup: SkillGroup
  vectorDefs: VectorDef[]
  selectedVector: VectorSelection
  included: boolean
  onToggleIncluded: () => void
  onUpdate: (field: 'label' | 'content', value: string) => void
  onUpdateVectors: (vectors: Record<string, SkillGroupVectorConfig>) => void
}

function cyclePriority(current: ComponentPriority): ComponentPriority {
  switch (current) {
    case 'must': return 'strong'
    case 'strong': return 'optional'
    case 'optional': return 'exclude'
    case 'exclude': return 'must'
    default: return 'must'
  }
}

function SortableSkillGroupCard({
  skillGroup,
  vectorDefs,
  selectedVector,
  included,
  onToggleIncluded,
  onUpdate,
  onUpdateVectors,
}: SortableSkillGroupCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: skillGroup.id })
  const [showConfig, setShowConfig] = useState(false)
  const normalizedVectors = ensureSkillGroupVectors(skillGroup, vectorDefs)
  const priority = selectedVector === 'all' ? 'must' : normalizedVectors[selectedVector]?.priority ?? 'exclude'

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handlePriorityCycle = () => {
    if (selectedVector === 'all') return
    const config = normalizedVectors[selectedVector]
    const next = cyclePriority(config.priority)
    onUpdateVectors({
      ...normalizedVectors,
      [selectedVector]: {
        ...config,
        priority: next,
      },
    })
  }

  const handleMatrixDotClick = (vectorId: string) => {
    const config = normalizedVectors[vectorId]
    const next = cyclePriority(config.priority)
    onUpdateVectors({
      ...normalizedVectors,
      [vectorId]: {
        ...config,
        priority: next,
      },
    })
  }

  return (
    <article className={`component-card bullet-card ${included ? '' : 'dimmed'}`} ref={setNodeRef} style={style}>
      <div className={`priority-strip priority-${priority}`} />
      
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
          {selectedVector !== 'all' && (
            <button 
              type="button" 
              className={`priority-quick-toggle ${priority}`}
              onClick={handlePriorityCycle}
              title={`Priority for current vector: ${priority}. Click to cycle.`}
            >
              {priority}
            </button>
          )}
        </div>
        <div className="component-card-actions">
          <button 
            type="button" 
            className={`btn-ghost ${showConfig ? 'active' : ''}`}
            onClick={() => setShowConfig(!showConfig)}
            title="Vector-specific settings"
          >
            <Settings size={14} />
            Config
          </button>
          <button type="button" className="btn-ghost" aria-pressed={included} onClick={onToggleIncluded}>
            {included ? <Eye size={14} /> : <EyeOff size={14} />}
            {included ? 'Included' : 'Excluded'}
          </button>
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

      {showConfig && (
        <div className="skill-vector-config-drawer">
          <header className="drawer-header">
            <h5>Vector Configurations</h5>
            <button type="button" className="btn-ghost btn-icon-only" onClick={() => setShowConfig(false)}>
              <X size={14} />
            </button>
          </header>
          <div className="skill-vector-grid">
            {vectorDefs.map((vector) => {
              const config = normalizedVectors[vector.id]
              return (
                <div className="skill-vector-card" key={vector.id}>
                  <div className="skill-vector-heading">
                    <span className="vector-dot" style={{ ['--vector-color' as string]: vector.color }} />
                    <strong>{vector.label}</strong>
                  </div>
                  <div className="skill-vector-fields">
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
                      Content Override
                      <textarea
                        className="component-input compact"
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
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bullet-footer-row">
        <div />
        <div className="vector-matrix">
          {vectorDefs.map((vector, idx) => {
            const config = normalizedVectors[vector.id]
            const p = config.priority
            const isLastFew = idx >= vectorDefs.length - 2
            return (
              <button
                key={vector.id}
                type="button"
                className={`matrix-dot priority-${p} ${isLastFew ? 'tooltip-left' : ''}`}
                style={{ '--vector-color': vector.color } as any}
                data-tooltip={`${vector.label}: ${p}`}
                onClick={() => handleMatrixDotClick(vector.id)}
                aria-label={`${vector.label} priority: ${p}`}
              />
            )
          })}
        </div>
      </div>
    </article>
  )
}

export function SkillGroupList({
  skillGroups,
  vectorDefs,
  selectedVector,
  includedByKey,
  onReorder,
  onUpdate,
  onUpdateVectors,
  onToggleIncluded,
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
                selectedVector={selectedVector}
                included={includedByKey[skillGroup.id] ?? true}
                onToggleIncluded={() => onToggleIncluded(skillGroup.id)}
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
