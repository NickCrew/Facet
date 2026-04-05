import { ArrowRight, GitMerge, RefreshCcw, ShieldCheck } from 'lucide-react'
import type { IdentityApplyMode } from '../../types/identity'

interface IdentityModelBuilderCardProps {
  counts: {
    roles: number
    bullets: number
    profiles: number
    projects: number
    skillGroups: number
  } | null
  draftDocument: string
  hasCurrentIdentity: boolean
  onSetDraftDocument: (value: string) => void
  onValidateDraft: () => void
  onApply: (mode: IdentityApplyMode) => void
  onPushToBuild: () => void
}

export function IdentityModelBuilderCard({
  counts,
  draftDocument,
  hasCurrentIdentity,
  onSetDraftDocument,
  onValidateDraft,
  onApply,
  onPushToBuild,
}: IdentityModelBuilderCardProps) {
  return (
    <section className="identity-card">
      <div className="identity-card-header">
        <div>
          <h2>Identity Model Builder</h2>
          <p>Validate the current draft JSON, then apply it as a replace or merge operation.</p>
        </div>
        <div className="identity-card-actions">
          <button className="identity-btn" type="button" onClick={onValidateDraft}>
            <ShieldCheck size={16} />
            Validate Draft
          </button>
          <button className="identity-btn" type="button" onClick={() => onApply('merge')} disabled={!draftDocument.trim()}>
            <GitMerge size={16} />
            Merge Draft
          </button>
          <button
            className="identity-btn identity-btn-primary"
            type="button"
            onClick={() => onApply('replace')}
            disabled={!draftDocument.trim()}
          >
            <RefreshCcw size={16} />
            Replace Identity
          </button>
        </div>
      </div>

      <div className="identity-stats">
        <div className="identity-stat" role="group" aria-label={'Roles: ' + (counts?.roles ?? 0)}>
          <span className="identity-stat-label">Roles</span>
          <strong>{counts?.roles ?? 0}</strong>
        </div>
        <div className="identity-stat" role="group" aria-label={'Bullets: ' + (counts?.bullets ?? 0)}>
          <span className="identity-stat-label">Bullets</span>
          <strong>{counts?.bullets ?? 0}</strong>
        </div>
        <div className="identity-stat" role="group" aria-label={'Profiles: ' + (counts?.profiles ?? 0)}>
          <span className="identity-stat-label">Profiles</span>
          <strong>{counts?.profiles ?? 0}</strong>
        </div>
        <div className="identity-stat" role="group" aria-label={'Projects: ' + (counts?.projects ?? 0)}>
          <span className="identity-stat-label">Projects</span>
          <strong>{counts?.projects ?? 0}</strong>
        </div>
        <div className="identity-stat" role="group" aria-label={'Skill Groups: ' + (counts?.skillGroups ?? 0)}>
          <span className="identity-stat-label">Skill Groups</span>
          <strong>{counts?.skillGroups ?? 0}</strong>
        </div>
      </div>

      <label className="identity-field">
        <span className="identity-label">Draft JSON</span>
        <textarea
          className="identity-textarea identity-textarea-code"
          value={draftDocument}
          onChange={(event) => onSetDraftDocument(event.target.value)}
          placeholder='{"version": 3, "...": "..."}'
        />
      </label>

      <div className="identity-card-actions">
        <button
          className="identity-btn identity-btn-primary"
          type="button"
          onClick={onPushToBuild}
          disabled={!hasCurrentIdentity}
        >
          <ArrowRight size={16} />
          Push To Build
        </button>
      </div>
    </section>
  )
}
