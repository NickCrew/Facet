import { Edit3, Trash2, Zap, BookOpen, ArrowRight } from 'lucide-react'
import type { PipelineEntry } from '../../types/pipeline'
import { useResumeStore } from '../../store/resumeStore'
import { sanitizeUrl } from '../../utils/sanitizeUrl'

interface PipelineDetailProps {
  entry: PipelineEntry
  onEdit: () => void
  onDelete: () => void
  onAnalyze: () => void
  onPrep: () => void
  onOpenInBuilder: () => void
}

export function PipelineDetail({ entry, onEdit, onDelete, onAnalyze, onPrep, onOpenInBuilder }: PipelineDetailProps) {
  const activeStatuses = new Set(['screening', 'interviewing'])
  const linkedPreset = useResumeStore((s) =>
    entry.presetId ? (s.data.presets ?? []).find((p) => p.id === entry.presetId) ?? null : null
  )

  return (
    <div className="pipeline-detail">
      <div className="pipeline-detail-grid">
        <Field label="Company" value={entry.company} />
        <Field label="Role" value={entry.role} />
        <Field label="Comp" value={entry.comp || '\u2014'} />
        <Field label="Contact" value={entry.contact || '\u2014'} />
        <Field label="Application Method" value={entry.appMethod} />
        <Field label="Response" value={entry.response} />
        <Field label="Days to Response" value={entry.daysToResponse != null ? String(entry.daysToResponse) : '\u2014'} />
        <Field label="Rounds" value={entry.rounds != null ? String(entry.rounds) : '\u2014'} />
        <Field label="Resume Variant" value={entry.resumeVariant || '\u2014'} />
        {entry.presetId && (
          <Field label="Linked Preset" value={linkedPreset ? linkedPreset.name : '(deleted)'} />
        )}
        <Field label="Date Applied" value={entry.dateApplied || '\u2014'} />
        {entry.rejectionStage && (
          <Field label="Rejection Stage" value={entry.rejectionStage} />
        )}
        {entry.rejectionReason && (
          <Field label="Rejection Reason" value={entry.rejectionReason} />
        )}
        {entry.offerAmount && (
          <Field label="Offer Amount" value={entry.offerAmount} />
        )}
        {entry.url && (
          <div className="pipeline-detail-field">
            <span className="pipeline-detail-field-label">URL</span>
            <span className="pipeline-detail-field-value">
              {sanitizeUrl(entry.url) ? (
                <a href={sanitizeUrl(entry.url)!} target="_blank" rel="noopener noreferrer">{entry.url}</a>
              ) : (
                <span title="Not a valid http/https URL">{entry.url}</span>
              )}
            </span>
          </div>
        )}
        {entry.format.length > 0 && (
          <Field label="Interview Formats" value={entry.format.join(', ')} />
        )}
        {entry.positioning && (
          <div className="pipeline-detail-field pipeline-detail-notes">
            <span className="pipeline-detail-field-label">Positioning</span>
            <span className="pipeline-detail-field-value">{entry.positioning}</span>
          </div>
        )}
        {entry.skillMatch && (
          <div className="pipeline-detail-field pipeline-detail-notes">
            <span className="pipeline-detail-field-label">Skill Match</span>
            <span className="pipeline-detail-field-value">{entry.skillMatch}</span>
          </div>
        )}
        {entry.notes && (
          <div className="pipeline-detail-field pipeline-detail-notes">
            <span className="pipeline-detail-field-label">Notes</span>
            <span className="pipeline-detail-field-value">{entry.notes}</span>
          </div>
        )}
        {entry.jobDescription && (
          <div className="pipeline-detail-field pipeline-detail-notes">
            <span className="pipeline-detail-field-label">Job Description</span>
            <div className="pipeline-detail-jd">{entry.jobDescription}</div>
          </div>
        )}
      </div>

      {entry.history.length > 0 && (
        <div className="pipeline-history">
          <span className="pipeline-history-title">History</span>
          {[...entry.history].reverse().map((h, i) => (
            <div key={i} className="pipeline-history-entry">
              <span className="pipeline-history-date">{h.date}</span>
              <span className="pipeline-history-note">{h.note}</span>
            </div>
          ))}
        </div>
      )}

      <div className="pipeline-detail-actions">
        <button className="pipeline-btn pipeline-btn-sm" onClick={onEdit}>
          <Edit3 size={14} /> Edit
        </button>
        {entry.vectorId && (
          <button className="pipeline-btn pipeline-btn-sm" onClick={onOpenInBuilder}>
            <ArrowRight size={14} /> Open in Builder
          </button>
        )}
        {entry.jobDescription && (
          <button className="pipeline-btn pipeline-btn-sm pipeline-btn-primary" onClick={onAnalyze}>
            <Zap size={14} /> Analyze in Builder
          </button>
        )}
        {activeStatuses.has(entry.status) && (
          <button className="pipeline-btn pipeline-btn-sm" onClick={onPrep}>
            <BookOpen size={14} /> Prep for Interview
          </button>
        )}
        <button className="pipeline-btn pipeline-btn-sm pipeline-btn-danger" onClick={onDelete}>
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="pipeline-detail-field">
      <span className="pipeline-detail-field-label">{label}</span>
      <span className="pipeline-detail-field-value">{value}</span>
    </div>
  )
}
