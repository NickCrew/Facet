import { Plus } from 'lucide-react'
import type { AddComponentPayload, AddComponentType } from '../types'

interface GapAnalysisPanelProps {
  skillGaps: string[]
  onQuickAdd: (type: AddComponentType, payload: AddComponentPayload) => void
}

export function GapAnalysisPanel({ skillGaps, onQuickAdd }: GapAnalysisPanelProps) {
  if (!skillGaps.length) {
    return (
      <div className="gap-analysis-empty">
        <p>No major skill gaps identified based on the job description.</p>
      </div>
    )
  }

  return (
    <div className="gap-analysis-panel">
      <p className="gap-intro">
        The following skills were highlighted in the job description but seem underrepresented in your resume:
      </p>
      <ul className="gap-list">
        {skillGaps.map((skill, index) => (
          <li key={index} className="gap-item">
            <span className="gap-skill-name">{skill}</span>
            <button
              type="button"
              className="btn-ghost btn-xs"
              onClick={() => onQuickAdd('skill_group', { label: skill, content: 'Summarize your experience with ' + skill })}
              title={`Add ${skill} to Skill Groups`}
            >
              <Plus size={12} />
              Add Now
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
