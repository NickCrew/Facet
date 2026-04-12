import type {
  IdentityConfidence,
  IdentityExtractionDraft,
} from "../../types/identity";

const CONFIDENCE_LABELS: Record<IdentityConfidence, string> = {
  stated: "Stated",
  confirmed: "Confirmed",
  guessing: "Guessing",
  corrected: "Corrected",
};

interface BulletConfidenceCardProps {
  draft: IdentityExtractionDraft | null;
}

export function BulletConfidenceCard({ draft }: BulletConfidenceCardProps) {
  const bullets = draft?.bullets ?? [];
  const bulletCount = bullets.length;

  return (
    <section className="identity-card identity-card-secondary">
      <div className="identity-card-header">
        <div>
          <h3>Confidence Review</h3>
          <p>
            Audit which bullet rewrites are stated, confirmed, corrected, or
            still inferred before you trust them elsewhere.
          </p>
          <span className="identity-section-status">
            {bulletCount
              ? `${bulletCount} bullet rewrite(s) ready to inspect`
              : "Waiting for draft generation"}
          </span>
        </div>
      </div>

      {bulletCount > 0 ? (
        <div className="identity-bullet-list">
          {bullets.map((bullet) => (
            <article
              className="identity-bullet-card"
              key={bullet.roleId + "::" + bullet.bulletId}
            >
              <div className="identity-bullet-meta">
                <span className="identity-bullet-role">{bullet.roleLabel}</span>
                <span className="identity-bullet-id">{bullet.bulletId}</span>
              </div>
              <p className="identity-bullet-text">{bullet.rewrite}</p>
              <div className="identity-chip-row">
                {bullet.assumptions.length > 0 ? (
                  bullet.assumptions.map((assumption, index) => (
                    <span
                      key={
                        bullet.bulletId + ":" + index + ":" + assumption.label
                      }
                      className={
                        "identity-chip identity-chip-" + assumption.confidence
                      }
                    >
                      {assumption.label} ·{" "}
                      {CONFIDENCE_LABELS[assumption.confidence]}
                    </span>
                  ))
                ) : (
                  <span className="identity-chip identity-chip-empty">
                    No explicit assumptions
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="identity-empty">
          <h4>No draft bullets yet</h4>
          <p>
            Generate a draft to inspect the confidence-tagged rewrite output.
          </p>
        </div>
      )}
    </section>
  );
}
