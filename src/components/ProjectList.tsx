import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, GripVertical } from 'lucide-react'
import { useState } from 'react'
import type { ComponentPriority, PriorityByVector, ProjectComponent, VectorDef, VectorSelection } from '../types'
import { getPriorityForVector } from '../engine/assembler'
import { componentKeys } from '../utils/componentKeys'
import { resolveDisplayText } from '../utils/resolveDisplayText'

interface ProjectListProps {
  projects: ProjectComponent[]
  vectorDefs: VectorDef[]
  selectedVector: VectorSelection
  includedByKey: Record<string, boolean>
  variantByKey: Record<string, string>
  onReorder: (nextOrder: string[]) => void
  onUpdate: (projectId: string, field: 'name' | 'url' | 'text', value: string) => void
  onUpdateVectors: (projectId: string, vectors: PriorityByVector) => void
  onToggleIncluded: (projectId: string, vectors: PriorityByVector) => void
  onSetVariant: (projectId: string, variant: string | null) => void
}

interface SortableProjectCardProps {
  project: ProjectComponent
  vectorDefs: VectorDef[]
  selectedVector: VectorSelection
  included: boolean
  variant?: string
  onUpdate: (field: 'name' | 'url' | 'text', value: string) => void
  onUpdateVectors: (vectors: PriorityByVector) => void
  onToggleIncluded: () => void
  onSetVariant: (variant: string | null) => void
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

function SortableProjectCard({
  project,
  vectorDefs,
  selectedVector,
  included,
  variant,
  onUpdate,
  onUpdateVectors,
  onToggleIncluded,
  onSetVariant,
}: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project.id })
  const priority = getPriorityForVector(project.vectors, selectedVector)
  const variantIds = project.variants ? Object.keys(project.variants) : []
  const showVariantPicker = variantIds.length > 0

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handlePriorityCycle = () => {
    if (selectedVector === 'all') return
    const next = cyclePriority(priority)
    const nextVectors = { ...project.vectors }
    if (next === 'exclude') {
      delete nextVectors[selectedVector]
    } else {
      nextVectors[selectedVector] = next
    }
    onUpdateVectors(nextVectors)
  }

  const handleMatrixDotClick = (vectorId: string) => {
    const currentPriority = project.vectors[vectorId] ?? 'exclude'
    const next = cyclePriority(currentPriority)
    const nextVectors = { ...project.vectors }
    if (next === 'exclude') {
      delete nextVectors[vectorId]
    } else {
      nextVectors[vectorId] = next
    }
    onUpdateVectors(nextVectors)
  }

  return (
    <article className={`component-card bullet-card ${included ? '' : 'dimmed'}`} ref={setNodeRef} style={style}>
      <div className={`priority-strip priority-${priority}`} />
      
      <header className="component-card-header">
        <div className="bullet-title-row">
          <button
            className="drag-handle"
            type="button"
            aria-label={`Reorder project ${project.name || project.id}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </button>
          <h4>Project</h4>
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
            className="btn-ghost"
            aria-pressed={included}
            onClick={onToggleIncluded}
            data-testid="project-toggle-included"
          >
            {included ? <Eye size={14} /> : <EyeOff size={14} />}
            {included ? 'Included' : 'Excluded'}
          </button>
        </div>
      </header>
      <input
        className="component-input compact"
        aria-label="Project name"
        value={project.name}
        onChange={(event) => onUpdate('name', event.target.value)}
      />
      <input
        className="component-input compact"
        aria-label="Project URL"
        value={project.url ?? ''}
        placeholder="URL"
        onChange={(event) => onUpdate('url', event.target.value)}
      />
      <textarea
        className="component-input"
        aria-label="Project description"
        value={resolveDisplayText(project.text, project.variants, variant, selectedVector).displayText}
        onChange={(event) => onUpdate('text', event.target.value)}
      />

      <div className="bullet-footer-row">
        {showVariantPicker ? (
          <label className="field-label variant-control">
            Variant
            <select
              className="component-input compact"
              value={variant ?? 'auto'}
              onChange={(event) =>
                onSetVariant(
                  event.target.value === 'auto' ? null : event.target.value,
                )
              }
            >
              <option value="auto">Auto</option>
              <option value="default">Default</option>
              {variantIds.map((variantId) => {
                const vector = vectorDefs.find((item) => item.id === variantId)
                return (
                  <option key={variantId} value={variantId}>
                    {vector?.label ?? variantId}
                  </option>
                )
              })}
            </select>
          </label>
        ) : <div />}

        <div className="vector-matrix">
          {vectorDefs.map((vector, idx) => {
            const p = project.vectors[vector.id] ?? 'exclude'
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

export function ProjectList({
  projects,
  vectorDefs,
  selectedVector,
  includedByKey,
  variantByKey,
  onReorder,
  onUpdate,
  onUpdateVectors,
  onToggleIncluded,
  onSetVariant,
}: ProjectListProps) {
  const projectIds = projects.map((project) => project.id)
  const [announcement, setAnnouncement] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const getPosition = (id: string | number) => projectIds.indexOf(String(id)) + 1

  const handleDragStart = (event: DragStartEvent) => {
    setAnnouncement(`Picked up project ${getPosition(event.active.id)}.`)
  }

  const handleDragCancel = () => {
    setAnnouncement('Project move canceled.')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = projectIds.indexOf(String(active.id))
    const newIndex = projectIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) {
      return
    }
    onReorder(arrayMove(projectIds, oldIndex, newIndex))
    setAnnouncement(`Dropped project at position ${newIndex + 1}.`)
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
        <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
          <div className="library-grid">
            {projects.map((project) => {
              const key = componentKeys.project(project.id)
              const included = includedByKey[key] ?? getPriorityForVector(project.vectors, selectedVector) !== 'exclude'
              return (
                <SortableProjectCard
                  key={project.id}
                  project={project}
                  vectorDefs={vectorDefs}
                  selectedVector={selectedVector}
                  included={included}
                  variant={variantByKey[key]}
                  onUpdate={(field, value) => onUpdate(project.id, field, value)}
                  onUpdateVectors={(vectors) => onUpdateVectors(project.id, vectors)}
                  onToggleIncluded={() => onToggleIncluded(project.id, project.vectors)}
                  onSetVariant={(variant) => onSetVariant(project.id, variant)}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </>
  )
}
