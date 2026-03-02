import { Undo2, Redo2 } from 'lucide-react'
import { useResumeStore } from '../store/resumeStore'

export function UndoRedoControls() {
  const canUndo = useResumeStore((s) => s.past.length > 0)
  const canRedo = useResumeStore((s) => s.future.length > 0)
  const undo = useResumeStore((s) => s.undo)
  const redo = useResumeStore((s) => s.redo)

  return (
    <div className="undo-redo-controls">
      <button
        className="btn-ghost"
        type="button"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (⌘Z)"
      >
        <Undo2 size={16} />
      </button>
      <button
        className="btn-ghost"
        type="button"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (⌘⇧Z)"
      >
        <Redo2 size={16} />
      </button>
    </div>
  )
}
