import type { IdentityConfidence, IdentityExtractionDraft } from '../../types/identity'

const CONFIDENCE_LABELS: Record<IdentityConfidence, string> = {
  stated: 'Stated',
  confirmed: 'Confirmed',
  guessing: 'Guessing',
  corrected: 'Corrected',
}

interface BulletConfidenceCardProps {
  draft: IdentityExtractionDraft | null
}

export function BulletConfidenceCard({ draft }: BulletConfidenceCardProps) {
  return (
    <section className="identity-card">
      <div className="identity-card-header">
        <div>
          <h2>Confidence-Tagged Bullets</h2>
          <p>
            Phase 0 gate: a populated identity model plus bullets that expose what is stated,
            confirmed, corrected, or still guessed.
          </p>
        </div>
      </div>

      {draft?.bullets.length ? (
        <div className="identity-bullet-list">
          {draft.bullets.map((bullet) => (
            <article className="identity-bullet-card" key={bullet.roleId + '::' + bullet.bulletId}>
              <div className="identity-bullet-meta">
                <span className="identity-bullet-role">{bullet.roleLabel}</span>
                <span className="identity-bullet-id">{bullet.bulletId}</span>
              </div>
              <p className="identity-bullet-text">{bullet.rewrite}</p>
              <div className="identity-chip-row">
                {bullet.assumptions.length > 0 ? (
                  bullet.assumptions.map((assumption, index) => (
                    <span
                      key={bullet.bulletId + ':' + index + ':' + assumption.label}
                      className={'identity-chip identity-chip-' + assumption.confidence}
                    >
                      {assumption.label} · {CONFIDENCE_LABELS[assumption.confidence]}
                    </span>
                  ))
                ) : (
                  <span className="identity-chip identity-chip-empty">No explicit assumptions</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="identity-empty">
          <h3>No draft bullets yet</h3>
          <p>Generate a draft to inspect the assumption-tagged rewrite output.</p>
        </div>
      )}
    </section>
  )
}
