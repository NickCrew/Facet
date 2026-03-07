import { Eye, EyeOff, Check, X, Wand2 } from 'lucide-react'
import { memo, useCallback, useRef } from 'react'
import type { ComponentPriority, PriorityByVector, TextVariantMap, VectorDef, VectorSelection, ComponentSuggestion } from '../types'
import { getPriorityForVector } from '../engine/assembler'
import { highlightVariables } from '../utils/variableHighlighting'

interface ComponentCardProps {
  id: string
  title: string
  body: string
  vectors: PriorityByVector
  vectorDefs: VectorDef[]
  selectedVector: VectorSelection
  included: boolean
  variants?: TextVariantMap
  selectedVariant?: string
  onToggleIncluded: (id: string, vectors: PriorityByVector) => void
  onVariantChange?: (id: string, variant: string | null) => void
  onBodyChange: (id: string, value: string) => void
  onVectorsChange?: (id: string, nextVectors: PriorityByVector) => void
  suggestion?: ComponentSuggestion
  onAcceptSuggestion?: (id: string, suggestion: ComponentSuggestion) => void
  onIgnoreSuggestion?: (id: string) => void
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

export const ComponentCard = memo(function ComponentCard({
  id,
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
  suggestion,
  onAcceptSuggestion,
  onIgnoreSuggestion,
}: ComponentCardProps) {
  const priority = getPriorityForVector(vectors, selectedVector)
  const variantEntries = Object.entries(variants ?? {})
  const showVariantPicker = variantEntries.length > 0 && onVariantChange
  const hasVariables = body.includes('{{')
  const overlayRef = useRef<HTMLDivElement>(null)

  const handlePriorityCycle = () => {
    if (selectedVector === 'all' || !onVectorsChange) return
    const next = cyclePriority(priority)
    const nextVectors = { ...vectors }
    if (next === 'exclude') {
      delete nextVectors[selectedVector]
    } else {
      nextVectors[selectedVector] = next
    }
    onVectorsChange(id, nextVectors)
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
    onVectorsChange(id, nextVectors)
  }

  const handleToggle = useCallback(() => {
    onToggleIncluded(id, vectors)
  }, [id, vectors, onToggleIncluded])

  const handleBodyChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onBodyChange(id, e.target.value)
  }, [id, onBodyChange])

  const handleVariantChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onVariantChange) {
      onVariantChange(id, e.target.value === 'auto' ? null : e.target.value)
    }
  }, [id, onVariantChange])

  return (
    <article className={`component-card ${included ? '' : 'dimmed'} ${suggestion ? 'has-suggestion' : ''}`}>
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
          <button type="button" className="btn-ghost" aria-pressed={included} onClick={handleToggle}>
            {included ? <Eye size={14} /> : <EyeOff size={14} />}
            {included ? 'Included' : 'Excluded'}
          </button>
        </div>
      </header>

      <div className="component-input-wrapper">
        <textarea
          aria-label={title}
          value={body}
          onChange={handleBodyChange}
          className={`component-input ${hasVariables ? 'with-variables' : ''}`}
          onScroll={hasVariables ? (e) => {
            if (overlayRef.current) {
              overlayRef.current.scrollTop = e.currentTarget.scrollTop
              overlayRef.current.scrollLeft = e.currentTarget.scrollLeft
            }
          } : undefined}
        />
        {hasVariables && (
          <div className="variable-preview" ref={overlayRef} aria-hidden="true">
            {highlightVariables(body)}
          </div>
        )}
      </div>

      <div className="bullet-footer-row">
        {showVariantPicker ? (
          <label className="field-label variant-control">
            Variant
            <select
              className="component-input compact"
              value={selectedVariant ?? 'auto'}
              onChange={handleVariantChange}
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

      {suggestion && (
        <div className="suggestion-overlay">
          <div className="suggestion-badge">
            <Wand2 size={12} /> AI Recommendation
          </div>
          <p className="suggestion-reason">{suggestion.reason}</p>
          <div className="suggestion-action-row">
            <div className={`suggestion-preview priority-${suggestion.recommendedPriority}`}>
              Change to {suggestion.recommendedPriority}
            </div>
            <div className="suggestion-buttons">
              <button 
                className="btn-secondary btn-xs" 
                onClick={() => onIgnoreSuggestion?.(id)}
                title="Ignore suggestion"
              >
                <X size={12} />
              </button>
              <button 
                className="btn-primary btn-xs" 
                onClick={() => onAcceptSuggestion?.(id, suggestion)}
                title="Accept suggestion"
              >
                <Check size={12} />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
})
