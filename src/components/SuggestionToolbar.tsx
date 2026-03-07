import { Check, X, Wand2 } from 'lucide-react'

interface SuggestionToolbarProps {
  onAcceptAll: () => void
  onDismissRemaining: () => void
  onExit: () => void
  activeVector: string
  suggestionCount: number
}

export function SuggestionToolbar({
  onAcceptAll,
  onDismissRemaining,
  onExit,
  activeVector,
  suggestionCount,
}: SuggestionToolbarProps) {
  return (
    <div 
      className="suggestion-toolbar" 
      role="toolbar" 
      aria-label="JD Suggestions"
      aria-live="polite"
    >
      <div className="suggestion-info">
        <Wand2 size={16} className="ai-icon" />
        <span>
          <strong>Suggestion Mode:</strong> {suggestionCount} recommendations for {activeVector}
        </span>
      </div>
      <div className="suggestion-toolbar-actions">
        <button className="btn-secondary btn-sm" onClick={onDismissRemaining}>
          <X size={14} />
          Dismiss Remaining
        </button>
        <button className="btn-primary btn-sm" onClick={onAcceptAll}>
          <Check size={14} />
          Accept All
        </button>
        <div className="toolbar-divider" />
        <button className="btn-ghost btn-sm" onClick={onExit}>
          Exit
        </button>
      </div>
    </div>
  )
}
