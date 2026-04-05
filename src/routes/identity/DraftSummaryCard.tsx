import type { IdentityChangeLogEntry, IdentityExtractionDraft } from '../../types/identity'

interface DraftSummaryCardProps {
  draft: IdentityExtractionDraft | null
  changelog: IdentityChangeLogEntry[]
}

export function DraftSummaryCard({ draft, changelog }: DraftSummaryCardProps) {
  return (
    <section className="identity-card">
      <div className="identity-card-header">
        <div>
          <h2>Draft Summary And Changelog</h2>
          <p>Track what the extraction loop generated and what the write layer actually applied.</p>
        </div>
      </div>

      <div className="identity-summary-block">
        <h3>Draft Summary</h3>
        <p>{draft?.summary ?? 'No draft summary yet.'}</p>
        {draft?.followUpQuestions.length ? (
          <ul className="identity-question-list">
            {draft.followUpQuestions.map((question, index) => (
              <li key={index + ':' + question}>{question}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="identity-summary-block">
        <h3>Changelog</h3>
        {changelog.length ? (
          <div className="identity-changelog">
            {changelog.map((entry) => (
              <article className="identity-log-entry" key={entry.id}>
                <div className="identity-log-header">
                  <strong>{entry.summary}</strong>
                  <span>{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                {entry.details.map((detail, index) => (
                  <p key={index + ':' + detail}>{detail}</p>
                ))}
              </article>
            ))}
          </div>
        ) : (
          <p className="identity-muted">No builder events yet.</p>
        )}
      </div>
    </section>
  )
}
