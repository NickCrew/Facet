import { Plus, Trash2, X } from 'lucide-react'
import { useState, forwardRef } from 'react'

interface VariableEditorProps {
  variables: Record<string, string>
  onChange: (variables: Record<string, string>) => void
  onClose: () => void
}

export const VariableEditor = forwardRef<HTMLDivElement, VariableEditorProps>(
  ({ variables, onChange, onClose }, ref) => {
    const [newKey, setNewKey] = useState('')
    const [newValue, setNewValue] = useState('')

    const handleAdd = () => {
      if (!newKey.trim()) return
      onChange({
        ...variables,
        [newKey.trim()]: newValue,
      })
      setNewKey('')
      setNewValue('')
    }

    const handleRemove = (key: string) => {
      const next = { ...variables }
      delete next[key]
      onChange(next)
    }

    const handleUpdateValue = (key: string, value: string) => {
      onChange({
        ...variables,
        [key]: value,
      })
    }

    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="variable-editor-title">
        <div className="modal-card variable-editor-modal" ref={ref} tabIndex={-1}>
          <header className="modal-header">
            <h3 id="variable-editor-title">Global Variables</h3>
            <button className="btn-ghost btn-icon-only" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </header>

          <p className="modal-intro">
            Define values for <code>{`{{placeholder}}`}</code> tokens used in your resume text.
          </p>

          <div className="variable-list">
            {Object.entries(variables).map(([key, value]) => (
              <div key={key} className="variable-row">
                <div className="variable-key">
                  <code>{`{{${key}}}`}</code>
                </div>
                <input
                  className="component-input compact"
                  value={value}
                  onChange={(e) => handleUpdateValue(key, e.target.value)}
                  placeholder="Value"
                />
                <button
                  className="btn-ghost btn-icon-only text-error"
                  onClick={() => handleRemove(key)}
                  aria-label={`Remove ${key}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="variable-add-row">
            <input
              className="component-input compact"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="new_key"
            />
            <input
              className="component-input compact"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value"
            />
            <button className="btn-secondary btn-sm" onClick={handleAdd} disabled={!newKey.trim()}>
              <Plus size={14} />
              Add
            </button>
          </div>

          <footer className="modal-footer">
            <button className="btn-primary" onClick={onClose}>
              Done
            </button>
          </footer>
        </div>
      </div>
    )
  },
)
