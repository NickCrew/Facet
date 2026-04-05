import { useMemo } from 'react'
import { Download, Plus, Trash2 } from 'lucide-react'
import { useIdentityStore } from '../../store/identityStore'
import { useMatchStore } from '../../store/matchStore'
import { useRecruiterStore } from '../../store/recruiterStore'
import type { RecruiterCard } from '../../types/recruiter'
import { createId } from '../../utils/idUtils'
import { createRecruiterCard } from '../../utils/recruiterCardGenerator'
import './recruiter.css'

const downloadCard = (card: RecruiterCard) => {
  const content = [
    `# ${card.company} - ${card.role}`,
    '',
    `Candidate: ${card.candidateName}`,
    `Title: ${card.candidateTitle}`,
    `Match Score: ${Math.round(card.matchScore * 100)}%`,
    '',
    'Recruiter Hook',
    card.recruiterHook,
    '',
    'Suggested Intro',
    card.suggestedIntro,
    '',
    'Top Reasons',
    ...card.topReasons.map((entry) => '- ' + entry),
    '',
    'Proof Points',
    ...card.proofPoints.map((entry) => '- ' + entry),
    '',
    'Skill Highlights',
    ...card.skillHighlights.map((entry) => '- ' + entry),
    '',
    'Positioning Angles',
    ...card.positioningAngles.map((entry) => '- ' + entry),
    '',
    'Likely Concerns',
    ...card.likelyConcerns.map((entry) => '- ' + entry),
    '',
    'Gap Bridges',
    ...card.gapBridges.map((entry) => '- ' + entry),
    '',
    'Notes',
    card.notes,
  ].join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'recruiter-card.txt'
  link.click()
  URL.revokeObjectURL(url)
}

const joinLines = (value: string[]): string => value.join('\n')
const splitLines = (value: string): string[] =>
  value.split(/\n+/).map((entry) => entry.trim()).filter(Boolean)

export function RecruiterPage() {
  const currentIdentity = useIdentityStore((state) => state.currentIdentity)
  const currentReport = useMatchStore((state) => state.currentReport)
  const {
    cards,
    selectedCardId,
    addCard,
    updateCard,
    deleteCard,
    setSelectedCardId,
  } = useRecruiterStore()

  const activeCard = useMemo(
    () => cards.find((card) => card.id === (selectedCardId ?? cards[0]?.id)) ?? null,
    [cards, selectedCardId],
  )

  const helperMessage =
    !currentIdentity
      ? 'Apply an identity model before generating a recruiter card.'
      : !currentReport
        ? 'Generate a Phase 1 match report before creating a recruiter card.'
        : null

  const handleCreateBlankCard = () => {
    addCard({
      id: createId('recruiter-card'),
      generatedAt: new Date().toISOString(),
      company: currentReport?.company ?? 'Target Company',
      role: currentReport?.role ?? 'Target Role',
      candidateName: currentIdentity?.identity.display_name ?? currentIdentity?.identity.name ?? '',
      candidateTitle: currentIdentity?.identity.title ?? currentReport?.role ?? '',
      matchScore: currentReport?.matchScore ?? 0,
      summary: currentReport?.summary ?? '',
      recruiterHook: '',
      suggestedIntro: '',
      topReasons: [],
      proofPoints: [],
      skillHighlights: [],
      positioningAngles: [],
      likelyConcerns: [],
      gapBridges: [],
      notes: '',
    })
  }

  const handleGenerate = () => {
    if (!currentIdentity || !currentReport) {
      return
    }

    addCard(
      createRecruiterCard({
        id: createId('recruiter-card'),
        identity: currentIdentity,
        report: currentReport,
      }),
    )
  }

  return (
    <div className="recruiter-page">
      <aside className="recruiter-sidebar" aria-label="Recruiter cards">
        <div className="recruiter-sidebar-header">
          <h2>Cards</h2>
          <button
            className="recruiter-icon-btn"
            type="button"
            onClick={handleCreateBlankCard}
            aria-label="Create blank recruiter card"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="recruiter-card-list">
          {cards.map((card) => (
            <div key={card.id} className="recruiter-card-list-item">
              <button
                type="button"
                className={`recruiter-card-button ${activeCard?.id === card.id ? 'active' : ''}`}
                onClick={() => setSelectedCardId(card.id)}
              >
                <span>{card.company} - {card.role}</span>
                <small>{Math.round(card.matchScore * 100)}% match</small>
              </button>
              <button
                type="button"
                className="recruiter-icon-btn recruiter-text-danger"
                onClick={() => deleteCard(card.id)}
                aria-label={`Delete ${card.company} ${card.role}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {cards.length === 0 && <p className="recruiter-empty-text">No recruiter cards yet.</p>}
        </div>
      </aside>

      <main className="recruiter-main">
        <section className="recruiter-panel">
          <div className="recruiter-panel-header">
            <div>
              <p className="recruiter-eyebrow">Phase 3</p>
              <h1>Recruiter Card Generator</h1>
              <p className="recruiter-copy">
                Build a one-page recruiter cheat sheet directly from the active match report so an advocate can pitch the candidate quickly and accurately.
              </p>
            </div>
            <button
              type="button"
              className="recruiter-btn recruiter-btn-primary"
              onClick={handleGenerate}
              disabled={!currentIdentity || !currentReport}
            >
              Generate from Match
            </button>
          </div>

          {currentReport ? (
            <div className="recruiter-context-card">
              <span>{currentReport.company} - {currentReport.role}</span>
              <span>Match {Math.round(currentReport.matchScore * 100)}%</span>
              <span>{currentReport.topSkills.slice(0, 3).map((entry) => entry.label).join(', ')}</span>
            </div>
          ) : null}

          {helperMessage && <p className="recruiter-note">{helperMessage}</p>}
        </section>

        {activeCard ? (
          <section className="recruiter-panel">
            <div className="recruiter-panel-header">
              <div>
                <h2>Active Card</h2>
                <p>Edit the generated recruiter-facing summary before sharing it.</p>
              </div>
              <button type="button" className="recruiter-btn" onClick={() => downloadCard(activeCard)}>
                <Download size={16} />
                Export
              </button>
            </div>

            <div className="recruiter-grid">
              <label className="recruiter-field recruiter-field-span">
                <span className="recruiter-label">Company</span>
                <input
                  className="recruiter-input"
                  value={activeCard.company}
                  onChange={(event) => updateCard(activeCard.id, { company: event.target.value })}
                />
              </label>
              <label className="recruiter-field recruiter-field-span">
                <span className="recruiter-label">Role</span>
                <input
                  className="recruiter-input"
                  value={activeCard.role}
                  onChange={(event) => updateCard(activeCard.id, { role: event.target.value })}
                />
              </label>
              <label className="recruiter-field">
                <span className="recruiter-label">Candidate name</span>
                <input
                  className="recruiter-input"
                  value={activeCard.candidateName}
                  onChange={(event) => updateCard(activeCard.id, { candidateName: event.target.value })}
                />
              </label>
              <label className="recruiter-field">
                <span className="recruiter-label">Candidate title</span>
                <input
                  className="recruiter-input"
                  value={activeCard.candidateTitle}
                  onChange={(event) => updateCard(activeCard.id, { candidateTitle: event.target.value })}
                />
              </label>
              <label className="recruiter-field recruiter-field-span">
                <span className="recruiter-label">Summary</span>
                <textarea
                  className="recruiter-textarea"
                  value={activeCard.summary}
                  onChange={(event) => updateCard(activeCard.id, { summary: event.target.value })}
                />
              </label>
              <label className="recruiter-field recruiter-field-span">
                <span className="recruiter-label">Recruiter hook</span>
                <textarea
                  className="recruiter-textarea"
                  value={activeCard.recruiterHook}
                  onChange={(event) => updateCard(activeCard.id, { recruiterHook: event.target.value })}
                />
              </label>
              <label className="recruiter-field recruiter-field-span">
                <span className="recruiter-label">Suggested intro</span>
                <textarea
                  className="recruiter-textarea"
                  value={activeCard.suggestedIntro}
                  onChange={(event) => updateCard(activeCard.id, { suggestedIntro: event.target.value })}
                />
              </label>
              <label className="recruiter-field">
                <span className="recruiter-label">Top reasons</span>
                <textarea
                  className="recruiter-textarea"
                  value={joinLines(activeCard.topReasons)}
                  onChange={(event) => updateCard(activeCard.id, { topReasons: splitLines(event.target.value) })}
                />
              </label>
              <label className="recruiter-field">
                <span className="recruiter-label">Proof points</span>
                <textarea
                  className="recruiter-textarea"
                  value={joinLines(activeCard.proofPoints)}
                  onChange={(event) => updateCard(activeCard.id, { proofPoints: splitLines(event.target.value) })}
                />
              </label>
              <label className="recruiter-field">
                <span className="recruiter-label">Skill highlights</span>
                <textarea
                  className="recruiter-textarea"
                  value={joinLines(activeCard.skillHighlights)}
                  onChange={(event) => updateCard(activeCard.id, { skillHighlights: splitLines(event.target.value) })}
                />
              </label>
              <label className="recruiter-field">
                <span className="recruiter-label">Positioning angles</span>
                <textarea
                  className="recruiter-textarea"
                  value={joinLines(activeCard.positioningAngles)}
                  onChange={(event) => updateCard(activeCard.id, { positioningAngles: splitLines(event.target.value) })}
                />
              </label>
              <label className="recruiter-field">
                <span className="recruiter-label">Likely concerns</span>
                <textarea
                  className="recruiter-textarea"
                  value={joinLines(activeCard.likelyConcerns)}
                  onChange={(event) => updateCard(activeCard.id, { likelyConcerns: splitLines(event.target.value) })}
                />
              </label>
              <label className="recruiter-field">
                <span className="recruiter-label">Gap bridges</span>
                <textarea
                  className="recruiter-textarea"
                  value={joinLines(activeCard.gapBridges)}
                  onChange={(event) => updateCard(activeCard.id, { gapBridges: splitLines(event.target.value) })}
                />
              </label>
              <label className="recruiter-field recruiter-field-span">
                <span className="recruiter-label">Notes</span>
                <textarea
                  className="recruiter-textarea recruiter-textarea-lg"
                  value={activeCard.notes}
                  onChange={(event) => updateCard(activeCard.id, { notes: event.target.value })}
                />
              </label>
            </div>
          </section>
        ) : (
          <section className="recruiter-empty">
            <h2>No recruiter card yet</h2>
            <p>Generate one from the active match report or create a blank card to edit manually.</p>
          </section>
        )}
      </main>
    </div>
  )
}
