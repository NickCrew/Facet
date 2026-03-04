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
import { ChevronRight, Eye, EyeOff, GripVertical, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import type { ComponentPriority, PriorityByVector, Role, TextVariantMap, VectorDef, VectorSelection } from '../types'
import { getPriorityForVector } from '../engine/assembler'
import { resolveDisplayText } from '../utils/resolveDisplayText'

interface BulletListProps {
  role: Role
  vectorDefs: VectorDef[]
  selectedVector: VectorSelection
  customOrderLabel?: string
  canResetOrder: boolean
  onResetOrder: () => void
  includedByBulletId: Record<string, boolean>
  variantByBulletId: Record<string, string | undefined>
  onToggleBullet: (bulletId: string) => void
  onReorder: (nextOrder: string[]) => void
  onChangeBulletText: (bulletId: string, text: string) => void
  onSetBulletVariant: (bulletId: string, variant: string | null) => void
  onSetBulletVectors: (bulletId: string, vectors: PriorityByVector) => void
  onUpdateRole: (field: 'company' | 'title' | 'dates' | 'location' | 'subtitle', value: string | null) => void
  onReframe: (bulletId: string) => void
  reframeLoadingId: string | null
  aiEnabled: boolean
}

interface SortableBulletProps {
  id: string
  text: string
  vectors: PriorityByVector
  priority: ComponentPriority
  included: boolean
  variants?: TextVariantMap
  selectedVariant?: string
  vectorDefs: VectorDef[]
  selectedVector: VectorSelection
  onToggle: () => void
  onChangeText: (value: string) => void
  onVariantChange: (variant: string | null) => void
  onVectorsChange: (vectors: PriorityByVector) => void
  onReframe: () => void
  isLoading: boolean
  aiEnabled: boolean
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

function SortableBullet({
  id,
  text,
  vectors,
  priority,
  included,
  variants,
  selectedVariant,
  vectorDefs,
  selectedVector,
  onToggle,
  onChangeText,
  onVariantChange,
  onVectorsChange,
  onReframe,
  isLoading,
  aiEnabled,
}: SortableBulletProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const variantEntries = Object.entries(variants ?? {})
  const showVariantPicker = variantEntries.length > 0

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handlePriorityCycle = () => {
    if (selectedVector === 'all') return
    const next = cyclePriority(priority)
    const nextVectors = { ...vectors }
    if (next === 'exclude') {
      delete nextVectors[selectedVector]
    } else {
      nextVectors[selectedVector] = next
    }
    onVectorsChange(nextVectors)
  }

  const handleMatrixDotClick = (vectorId: string) => {
    const currentPriority = vectors[vectorId] ?? 'exclude'
    const next = cyclePriority(currentPriority)
    const nextVectors = { ...vectors }
    if (next === 'exclude') {
      delete nextVectors[vectorId]
    } else {
      nextVectors[vectorId] = next
    }
    onVectorsChange(nextVectors)
  }

  return (
    <article className={`component-card bullet-card ${included ? '' : 'dimmed'}`} ref={setNodeRef} style={style}>
      <div className={`priority-strip priority-${priority}`} />
      
      <header className="component-card-header">
        <div className="bullet-title-row">
          <button
            className="drag-handle"
            type="button"
            aria-label="Reorder bullet"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </button>
          <h4>Bullet</h4>
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
          {aiEnabled && selectedVector !== 'all' && (
            <button
              type="button"
              className="btn-ghost"
              onClick={onReframe}
              disabled={isLoading}
              title="AI Reframe for Vector"
              aria-busy={isLoading}
            >
              <span className="btn-label">
                {isLoading ? 'Reframing...' : 'Reframe'}
              </span>
              <Sparkles size={14} className={isLoading ? 'animate-pulse' : ''} />
            </button>
          )}
          <button type="button" className="btn-ghost" aria-pressed={included} onClick={onToggle}>
            {included ? <Eye size={14} /> : <EyeOff size={14} />}
            {included ? 'Included' : 'Excluded'}
          </button>
        </div>
      </header>
      <textarea
        value={text}
        className="component-input"
        aria-label="Bullet text"
        onChange={(event) => onChangeText(event.target.value)}
      />
      
      <div className="bullet-footer-row">
        {showVariantPicker ? (
          <label className="field-label variant-control">
            Variant
            <select
              className="component-input compact"
              value={selectedVariant ?? 'auto'}
              onChange={(event) => onVariantChange(event.target.value === 'auto' ? null : event.target.value)}
            >
              <option value="auto">Auto</option>
              <option value="default">Default</option>
              {variantEntries.map(([variantId]) => {
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
            const p = vectors[vector.id] ?? 'exclude'
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

export function BulletList({
  role,
  vectorDefs,
  selectedVector,
  customOrderLabel,
  canResetOrder,
  onResetOrder,
  includedByBulletId,
  variantByBulletId,
  onToggleBullet,
  onReorder,
  onChangeBulletText,
  onSetBulletVariant,
  onSetBulletVectors,
  onUpdateRole,
  onReframe,
  reframeLoadingId,
  aiEnabled,
}: BulletListProps) {
  const bulletIds = role.bullets.map((bullet) => bullet.id)
  const [expanded, setExpanded] = useState(true)
  const [announcement, setAnnouncement] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const getPosition = (id: string | number) => bulletIds.indexOf(String(id)) + 1

  const handleDragStart = (event: { active: { id: string | number } }) => {
    setAnnouncement(`Picked up bullet ${getPosition(event.active.id)}.`)
  }

  const handleDragCancel = () => {
    setAnnouncement('Bullet move canceled.')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = bulletIds.indexOf(String(active.id))
    const newIndex = bulletIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) {
      return
    }
    const moved = arrayMove(bulletIds, oldIndex, newIndex)
    onReorder(moved)
    setAnnouncement(`Dropped bullet at position ${newIndex + 1}.`)
  }

  const collapseId = `role-collapse-${role.id}`

  return (
    <section className="role-block">
      <header className="role-header">
        <button
          className={`role-collapse-toggle ${expanded ? 'expanded' : ''}`}
          type="button"
          aria-expanded={expanded}
          aria-controls={collapseId}
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse role' : 'Expand role'}
        >
          <ChevronRight size={14} />
        </button>
        <div className="role-header-main">
          <div className="role-fields">
            <label className="field-label">
              Company
              <input
                className="component-input compact"
                value={role.company}
                onChange={(event) => onUpdateRole('company', event.target.value)}
              />
            </label>
            <label className="field-label">
              Title
              <input
                className="component-input compact"
                value={role.title}
                onChange={(event) => onUpdateRole('title', event.target.value)}
              />
            </label>
            <label className="field-label">
              Dates
              <input
                className="component-input compact"
                value={role.dates}
                onChange={(event) => onUpdateRole('dates', event.target.value)}
              />
            </label>
            {role.location != null ? (
              <label className="field-label optional-field">
                Location
                <div className="optional-field-row">
                  <input
                    className="component-input compact"
                    value={role.location}
                    onChange={(event) => onUpdateRole('location', event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-ghost btn-icon"
                    onClick={() => onUpdateRole('location', null)}
                    aria-label="Remove location"
                  >
                    <X size={14} />
                  </button>
                </div>
              </label>
            ) : (
              <button
                type="button"
                className="btn-ghost btn-add-optional"
                onClick={() => onUpdateRole('location', '')}
              >
                <span>+ Location</span>
              </button>
            )}
            {role.subtitle != null ? (
              <label className="field-label optional-field">
                Subtitle
                <div className="optional-field-row">
                  <input
                    className="component-input compact"
                    value={role.subtitle}
                    onChange={(event) => onUpdateRole('subtitle', event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-ghost btn-icon"
                    onClick={() => onUpdateRole('subtitle', null)}
                    aria-label="Remove subtitle"
                  >
                    <X size={14} />
                  </button>
                </div>
              </label>
            ) : (
              <button
                type="button"
                className="btn-ghost btn-add-optional"
                onClick={() => onUpdateRole('subtitle', '')}
              >
                <span>+ Subtitle</span>
              </button>
            )}
          </div>
          {customOrderLabel ? <span className="custom-order-badge">{customOrderLabel}</span> : null}
        </div>
        <div className="role-header-actions">
          <button
            type="button"
            className="btn-ghost"
            disabled={!canResetOrder}
            onClick={onResetOrder}
          >
            Reset Order
          </button>
        </div>
      </header>

      <div
        className={`role-collapse ${expanded ? 'expanded' : ''}`}
        id={collapseId}
        aria-hidden={!expanded}
      >
        <div className="role-collapse-panel">
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
            <SortableContext items={bulletIds} strategy={verticalListSortingStrategy}>
              <div className="bullet-list">
                {role.bullets.map((bullet) => (
                  <SortableBullet
                    key={bullet.id}
                    id={bullet.id}
                    text={resolveDisplayText(bullet.text, bullet.variants, variantByBulletId[bullet.id], selectedVector).displayText}
                    vectors={bullet.vectors}
                    priority={getPriorityForVector(bullet.vectors, selectedVector)}
                    included={includedByBulletId[bullet.id] ?? true}
                    variants={bullet.variants}
                    selectedVariant={variantByBulletId[bullet.id]}
                    vectorDefs={vectorDefs}
                    selectedVector={selectedVector}
                    onToggle={() => onToggleBullet(bullet.id)}
                    onChangeText={(value) => onChangeBulletText(bullet.id, value)}
                    onVariantChange={(value) => onSetBulletVariant(bullet.id, value)}
                    onVectorsChange={(vectors) => onSetBulletVectors(bullet.id, vectors)}
                    onReframe={() => onReframe(bullet.id)}
                    isLoading={reframeLoadingId === bullet.id}
                    aiEnabled={aiEnabled}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </section>
  )
}
