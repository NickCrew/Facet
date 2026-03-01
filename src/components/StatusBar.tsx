import { AlertTriangle } from 'lucide-react'

interface StatusBarProps {
  pageCount: number | null
  pageCountPending?: boolean
  bulletCount: number
  skillGroupCount: number
  nearBudget: boolean
  overBudget: boolean
  mustOverBudget: boolean
  activeVariantLabel?: string
  variantDirty?: boolean
}

export function StatusBar({
  pageCount,
  pageCountPending,
  bulletCount,
  skillGroupCount,
  nearBudget,
  overBudget,
  mustOverBudget,
  activeVariantLabel,
  variantDirty,
}: StatusBarProps) {
  const showWarning = nearBudget || overBudget

  return (
    <footer
      className={`status-bar ${overBudget ? 'critical' : nearBudget ? 'warning' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span>
        {pageCountPending && pageCount === null
          ? 'Rendering PDF...'
          : `${pageCount ?? 1} page${(pageCount ?? 1) === 1 ? '' : 's'}`}
      </span>
      <span>{bulletCount} bullets</span>
      <span>{skillGroupCount} skill groups</span>
      {activeVariantLabel ? (
        <span className={`variant-status ${variantDirty ? 'dirty' : ''}`}>
          Editing: {activeVariantLabel}
          {variantDirty ? ' *' : ''}
          {variantDirty ? <span className="sr-only"> (unsaved changes)</span> : null}
        </span>
      ) : null}
      {showWarning && (
        <span className="status-warning">
          <AlertTriangle size={14} />
          {mustOverBudget
            ? 'Must-tagged content exceeds budget'
            : overBudget
              ? 'Estimated at 2+ pages; lower-priority bullets were trimmed'
              : 'Approaching 2-page target (>= 1.8 pages)'}
        </span>
      )}
    </footer>
  )
}
