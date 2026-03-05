import { Eye, EyeOff } from 'lucide-react'
import type { ComponentPriority, PriorityByVector, TextVariantMap, VectorDef, VectorSelection } from '../types'
import { getPriorityForVector } from '../engine/assembler'

interface ComponentCardProps {
  title: string
  body: string
  vectors: PriorityByVector
  vectorDefs: VectorDef[]
  selectedVector: VectorSelection
  included: boolean
  variants?: TextVariantMap
  selectedVariant?: string
  onToggleIncluded: () => void
  onVariantChange?: (variant: string | null) => void
  onBodyChange: (value: string) => void
  onVectorsChange?: (nextVectors: PriorityByVector) => void
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

export function ComponentCard({
  title,
  body,
  vectors,
  vectorDefs,
  selectedVector,
  included,
  variants,
  selectedVariant,
  onToggleIncluded,
  onVariantChange,
  onBodyChange,
  onVectorsChange,
}: ComponentCardProps) {
  const priority = getPriorityForVector(vectors, selectedVector)
  const variantEntries = Object.entries(variants ?? {})
  const showVariantPicker = variantEntries.length > 0 && onVariantChange

  const handlePriorityCycle = () => {
    if (selectedVector === 'all' || !onVectorsChange) return
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
    if (!onVectorsChange) return
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
    <article className={`component-card ${included ? '' : 'dimmed'}`}>
      <div className={`priority-strip priority-${priority}`} />
      
      <header className="component-card-header">
        <div className="bullet-title-row">
          <h4>{title}</h4>
          {selectedVector !== 'all' && onVectorsChange && (
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
          <button type="button" className="btn-ghost" aria-pressed={included} onClick={onToggleIncluded}>
            {included ? <Eye size={14} /> : <EyeOff size={14} />}
            {included ? 'Included' : 'Excluded'}
          </button>
        </div>
      </header>

      <textarea
        aria-label={title}
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        className="component-input"
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

        {onVectorsChange && (
          <div className="vector-matrix">
            {vectorDefs.map((vector, idx) => {
              const p = vectors[vector.id] ?? 'exclude'
              const isLastFew = idx >= vectorDefs.length - 2
              return (
                <button
                  key={vector.id}
                  type="button"
                  className={`matrix-dot priority-${p} ${isLastFew ? 'tooltip-left' : ''}`}
                  style={{ '--vector-color': vector.color } as React.CSSProperties}
                  data-tooltip={`${vector.label}: ${p}`}
                  onClick={() => handleMatrixDotClick(vector.id)}
                  aria-label={`${vector.label} priority: ${p}`}
                />
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}
