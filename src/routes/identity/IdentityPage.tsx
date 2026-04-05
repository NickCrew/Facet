import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Download,
  FileJson,
  GitMerge,
  ScanSearch,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { professionalIdentityToResumeData } from '../../identity/resumeAdapter'
import { useIdentityStore } from '../../store/identityStore'
import { useResumeStore } from '../../store/resumeStore'
import { useUiStore } from '../../store/uiStore'
import { type IdentityApplyMode, type IdentityConfidence } from '../../types/identity'
import { sanitizeEndpointUrl } from '../../utils/idUtils'
import {
  generateIdentityDraft,
  parseIdentityExtractionResponse,
} from '../../utils/identityExtraction'
import { scanResumePdf } from '../../utils/resumeScanner'
import {
  resolveComparisonVectorAfterReplaceImport,
  resolveSelectedVectorAfterReplaceImport,
} from '../../utils/importSelection'
import { parseJsonWithRepair } from '../../utils/jsonParsing'
import { ScannedIdentityEditor } from './ScannedIdentityEditor'
import './identity.css'

const CONFIDENCE_LABELS: Record<IdentityConfidence, string> = {
  stated: 'Stated',
  confirmed: 'Confirmed',
  guessing: 'Guessing',
  corrected: 'Corrected',
}

const downloadJson = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function IdentityPage() {
  const navigate = useNavigate()
  const importRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [pageNotice, setPageNotice] = useState<string | null>(null)
  const intakeMode = useIdentityStore((state) => state.intakeMode)
  const sourceMaterial = useIdentityStore((state) => state.sourceMaterial)
  const correctionNotes = useIdentityStore((state) => state.correctionNotes)
  const currentIdentity = useIdentityStore((state) => state.currentIdentity)
  const draft = useIdentityStore((state) => state.draft)
  const draftDocument = useIdentityStore((state) => state.draftDocument)
  const scanResult = useIdentityStore((state) => state.scanResult)
  const warnings = useIdentityStore((state) => state.warnings)
  const changelog = useIdentityStore((state) => state.changelog)
  const setIntakeMode = useIdentityStore((state) => state.setIntakeMode)
  const setSourceMaterial = useIdentityStore((state) => state.setSourceMaterial)
  const setCorrectionNotes = useIdentityStore((state) => state.setCorrectionNotes)
  const setDraft = useIdentityStore((state) => state.setDraft)
  const setDraftDocument = useIdentityStore((state) => state.setDraftDocument)
  const setScanResult = useIdentityStore((state) => state.setScanResult)
  const updateScannedIdentityCore = useIdentityStore((state) => state.updateScannedIdentityCore)
  const updateScannedRole = useIdentityStore((state) => state.updateScannedRole)
  const updateScannedBulletSourceText = useIdentityStore((state) => state.updateScannedBulletSourceText)
  const updateScannedSkillGroupLabel = useIdentityStore((state) => state.updateScannedSkillGroupLabel)
  const updateScannedSkillItemName = useIdentityStore((state) => state.updateScannedSkillItemName)
  const updateScannedEducationEntry = useIdentityStore((state) => state.updateScannedEducationEntry)
  const importIdentity = useIdentityStore((state) => state.importIdentity)
  const applyDraft = useIdentityStore((state) => state.applyDraft)
  const selectedVector = useUiStore((state) => state.selectedVector)
  const comparisonVector = useUiStore((state) => state.comparisonVector)
  const setSelectedVector = useUiStore((state) => state.setSelectedVector)
  const setComparisonVector = useUiStore((state) => state.setComparisonVector)
  const setData = useResumeStore((state) => state.setData)

  const aiEndpoint = useMemo(
    () => sanitizeEndpointUrl((import.meta.env.VITE_ANTHROPIC_PROXY_URL as string | undefined) ?? ''),
    [],
  )

  const counts = useMemo(() => {
    const identity = currentIdentity ?? draft?.identity ?? null
    if (!identity) {
      return null
    }

    const bulletCount = identity.roles.reduce((total, role) => total + role.bullets.length, 0)
    return {
      roles: identity.roles.length,
      bullets: bulletCount,
      profiles: identity.profiles.length,
      projects: identity.projects.length,
      skillGroups: identity.skills.groups.length,
    }
  }, [currentIdentity, draft])

  const scanCompletion = useMemo(() => {
    if (!scanResult) {
      return null
    }

    const activeIdentity = draft?.identity ?? currentIdentity
    if (!activeIdentity) {
      return {
        extractedBullets: scanResult.counts.extractedBullets,
        decomposedBullets: 0,
      }
    }

    const activeBulletMap = new Map(
      activeIdentity.roles.flatMap((role) =>
        role.bullets.map((bullet) => [
          `${role.id}::${bullet.id}`,
          Boolean([bullet.problem, bullet.action, bullet.outcome].some((entry) => entry.trim())),
        ]),
      ),
    )

    const decomposedBullets = scanResult.identity.roles.reduce(
      (total, role) =>
        total +
        role.bullets.filter((bullet) => activeBulletMap.get(`${role.id}::${bullet.id}`) === true).length,
      0,
    )

    return {
      extractedBullets: scanResult.counts.extractedBullets,
      decomposedBullets,
    }
  }, [currentIdentity, draft, scanResult])

  const ensureEndpoint = () => {
    if (!aiEndpoint) {
      throw new Error('Identity extraction is disabled. Configure VITE_ANTHROPIC_PROXY_URL.')
    }
  }

  const runGenerate = async (mode: 'fresh' | 'regenerate') => {
    const shouldUseScan = intakeMode === 'upload' && Boolean(scanResult)
    const effectiveSourceMaterial = shouldUseScan ? scanResult?.rawText ?? '' : sourceMaterial

    if (!effectiveSourceMaterial.trim()) {
      setPageNotice(null)
      setPageError('Source material is required before generating a draft.')
      return
    }

    try {
      ensureEndpoint()
      setPageError(null)
      setPageNotice(null)
      setIsGenerating(true)
      const nextDraft = await generateIdentityDraft({
        endpoint: aiEndpoint,
        sourceMaterial: effectiveSourceMaterial,
        correctionNotes,
        seedIdentity: shouldUseScan ? scanResult?.identity ?? null : null,
        existingDraft: mode === 'regenerate' ? draft?.identity ?? currentIdentity : null,
      })
      setDraft(nextDraft)
      setPageNotice(
        mode === 'regenerate'
          ? 'Regenerated the draft with the latest correction notes.'
          : 'Generated a new Professional Identity draft.',
      )
    } catch (error) {
      setPageNotice(null)
      setPageError(error instanceof Error ? error.message : 'Identity draft generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleScannedFile = async (file: File) => {
    if (!/\.pdf$/i.test(file.name)) {
      setPageNotice(null)
      setPageError('Resume Scanner v1 only supports PDF uploads.')
      return
    }

    try {
      setIsScanning(true)
      setPageError(null)
      setPageNotice(null)
      const result = await scanResumePdf(file)
      setSourceMaterial(result.rawText)

      if (result.identity.roles.length === 0) {
        setScanResult(null)
        setIntakeMode('paste')
        setPageNotice(
          result.warnings.find((warning) => warning.code === 'role-parse-fallback')?.message ??
            'Resume text extraction succeeded, but structural role parsing failed. The raw text is now loaded into paste-text mode.',
        )
        return
      }

      setScanResult(result)
      setIntakeMode('upload')
      setPageNotice(`Scanned ${file.name} into a structured identity shell.`)
    } catch (error) {
      setPageNotice(null)
      setPageError(error instanceof Error ? error.message : 'Resume scan failed.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleUploadChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    await handleScannedFile(file)
    event.target.value = ''
  }

  const handleDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) {
      return
    }

    await handleScannedFile(file)
  }

  const handleValidateDraft = () => {
    try {
      const parsedDraft = parseJsonWithRepair(draftDocument, 'Draft identity document')
      const parsed = parseIdentityExtractionResponse(
        JSON.stringify({
          summary: draft?.summary ?? 'Manual draft validation',
          follow_up_questions: draft?.followUpQuestions ?? [],
          identity: parsedDraft.data,
          bullets:
            draft?.bullets.map((bullet) => ({
              role_id: bullet.roleId,
              bullet_id: bullet.bulletId,
              rewrite: bullet.rewrite,
              tags: bullet.tags,
              assumptions: bullet.assumptions,
            })) ?? [],
        }),
      )
      setDraft(parsed)
      setPageError(null)
      setPageNotice(
        parsedDraft.repaired
          ? 'Validated the current draft JSON against the identity schema and repaired minor syntax issues.'
          : 'Validated the current draft JSON against the identity schema.',
      )
    } catch (error) {
      setPageNotice(null)
      setPageError(error instanceof Error ? error.message : 'Draft validation failed.')
    }
  }

  const handleApply = (mode: IdentityApplyMode) => {
    if (mode === 'replace' && currentIdentity) {
      const confirmed = window.confirm(
        'Replace the current identity model with the draft? This overwrites the existing model.',
      )
      if (!confirmed) {
        return
      }
    }

    try {
      const result = applyDraft(mode)
      setPageError(null)
      setPageNotice(result.summary)
    } catch (error) {
      setPageNotice(null)
      setPageError(error instanceof Error ? error.message : 'Unable to apply the current draft.')
    }
  }

  const handleImportJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const parsed = parseJsonWithRepair<unknown>(await file.text(), 'Imported identity JSON')
      const result = importIdentity(parsed.data, 'Imported identity model from JSON')
      setPageError(null)
      setPageNotice(
        parsed.repaired
          ? `${result.summary}. Repaired minor JSON syntax issues during import.`
          : result.summary,
      )
    } catch (error) {
      setPageNotice(null)
      setPageError(error instanceof Error ? error.message : 'Unable to import identity JSON.')
    } finally {
      event.target.value = ''
    }
  }

  const handleExportCurrent = () => {
    if (!currentIdentity) {
      setPageNotice(null)
      setPageError('Apply or import an identity model before exporting it.')
      return
    }

    downloadJson('identity.json', JSON.stringify(currentIdentity, null, 2))
    setPageError(null)
    setPageNotice('Exported the current identity model.')
  }

  const handleExportDraft = () => {
    if (!draftDocument.trim()) {
      setPageNotice(null)
      setPageError('Generate or import a draft before exporting it.')
      return
    }

    downloadJson('identity-draft.json', draftDocument)
    setPageError(null)
    setPageNotice('Exported the current draft document.')
  }

  const handlePushToBuild = () => {
    if (!currentIdentity) {
      setPageNotice(null)
      setPageError('Apply the draft to the identity model before pushing it into Build.')
      return
    }

    const confirmed = window.confirm(
      'Replace the Build workspace with data derived from this identity model? Existing overrides, presets, and bullet orders will be lost.',
    )
    if (!confirmed) {
      return
    }

    const adapted = professionalIdentityToResumeData(currentIdentity)
    setData(adapted.data)
    setSelectedVector(resolveSelectedVectorAfterReplaceImport(selectedVector, adapted.data.vectors))
    setComparisonVector(
      resolveComparisonVectorAfterReplaceImport(comparisonVector, adapted.data.vectors),
    )
    setPageError(null)
    setPageNotice('Pushed the current identity model into Build.')
    void navigate({ to: '/build' })
  }

  return (
    <div className="identity-page">
      <header className="identity-header">
        <div>
          <p className="identity-eyebrow">Phase 0</p>
          <h1>Professional Identity</h1>
          <p className="identity-copy">
            Build the write-layer and extraction loop for identity.json: draft from raw
            source material, correct it, validate it, then push the resulting model into Build.
          </p>
        </div>

        <div className="identity-header-actions">
          <button className="identity-btn" type="button" onClick={() => importRef.current?.click()}>
            <Upload size={16} />
            Import JSON
          </button>
          <button className="identity-btn" type="button" onClick={handleExportDraft}>
            <Download size={16} />
            Export Draft
          </button>
          <button className="identity-btn identity-btn-primary" type="button" onClick={handleExportCurrent}>
            <FileJson size={16} />
            Export Identity
          </button>
          <input
            ref={importRef}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={handleImportJson}
          />
        </div>
      </header>

      {pageError ? (
        <div className="identity-alert" role="alert">
          {pageError}
        </div>
      ) : null}
      {pageNotice ? (
        <div className="identity-notice" role="status" aria-live="polite">
          {pageNotice}
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div className="identity-warning" role="alert">
          <strong>Warnings:</strong> {warnings.join(' ')}
        </div>
      ) : null}

      <div className="identity-grid">
        <section className="identity-card">
          <div className="identity-card-header">
            <div>
              <h2>Extraction Agent</h2>
              <p>Upload a PDF first, or fall back to pasted text if the scan is ambiguous.</p>
            </div>
            <div className="identity-card-actions">
              <button
                className={`identity-btn ${intakeMode === 'upload' ? 'identity-btn-primary' : ''}`}
                type="button"
                onClick={() => setIntakeMode('upload')}
              >
                <ScanSearch size={16} />
                Upload Resume
              </button>
              <button
                className={`identity-btn ${intakeMode === 'paste' ? 'identity-btn-primary' : ''}`}
                type="button"
                onClick={() => setIntakeMode('paste')}
              >
                <Upload size={16} />
                Paste Text Instead
              </button>
              <button
                className="identity-btn identity-btn-primary"
                type="button"
                onClick={() => void runGenerate('fresh')}
                disabled={isGenerating || isScanning}
              >
                <Sparkles size={16} />
                {isGenerating ? 'Generating…' : 'Generate Draft'}
              </button>
              <button
                className="identity-btn"
                type="button"
                onClick={() => void runGenerate('regenerate')}
                disabled={isGenerating || isScanning || (!draft && !currentIdentity)}
              >
                <RefreshCcw size={16} />
                Regenerate
              </button>
            </div>
          </div>

          {intakeMode === 'upload' ? (
            <>
              <button
                className="identity-upload-zone"
                type="button"
                onClick={() => uploadRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => void handleDrop(event)}
              >
                <Upload size={22} />
                <strong>{isScanning ? 'Scanning PDF…' : 'Drop a PDF here or click to upload'}</strong>
                <span>
                  Resume Scanner v1 is PDF-only and performs a local structural parse before any AI call.
                </span>
              </button>
              <input
                ref={uploadRef}
                hidden
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => void handleUploadChange(event)}
              />

              {scanResult ? (
                <>
                  <div className="identity-scan-status">
                    <div className="identity-scan-status-row">
                      <strong>{scanResult.fileName}</strong>
                      <span>{scanResult.pageCount} page(s)</span>
                    </div>
                    <div className="identity-stats identity-stats-compact">
                      <div className="identity-stat" aria-label={'Roles: ' + scanResult.counts.roles}>
                        <span className="identity-stat-label">Roles</span>
                        <strong>{scanResult.counts.roles}</strong>
                      </div>
                      <div className="identity-stat" aria-label={'Bullets: ' + scanResult.counts.bullets}>
                        <span className="identity-stat-label">Bullets</span>
                        <strong>{scanResult.counts.bullets}</strong>
                      </div>
                      <div
                        className="identity-stat"
                        aria-label={'Skill groups: ' + scanResult.counts.skillGroups}
                      >
                        <span className="identity-stat-label">Skill Groups</span>
                        <strong>{scanResult.counts.skillGroups}</strong>
                      </div>
                      <div
                        className="identity-stat"
                        aria-label={'Education: ' + scanResult.counts.education}
                      >
                        <span className="identity-stat-label">Education</span>
                        <strong>{scanResult.counts.education}</strong>
                      </div>
                      <div
                        className="identity-stat"
                        aria-label={
                          'Decomposed bullets: ' +
                          (scanCompletion?.decomposedBullets ?? 0) +
                          ' of ' +
                          (scanCompletion?.extractedBullets ?? scanResult.counts.extractedBullets)
                        }
                      >
                        <span className="identity-stat-label">Deepened</span>
                        <strong>
                          {scanCompletion?.decomposedBullets ?? 0}/{scanCompletion?.extractedBullets ?? scanResult.counts.extractedBullets}
                        </strong>
                      </div>
                    </div>
                    <div className="identity-card-actions">
                      <button className="identity-btn" type="button" onClick={() => uploadRef.current?.click()}>
                        <RefreshCcw size={16} />
                        Rescan PDF
                      </button>
                      <button
                        className="identity-btn"
                        type="button"
                        onClick={() => {
                          setScanResult(null)
                          setPageNotice('Cleared the scanned resume structure.')
                        }}
                      >
                        <X size={16} />
                        Clear Scan
                      </button>
                    </div>
                  </div>

                  <ScannedIdentityEditor
                    scanResult={scanResult}
                    onUpdateIdentityCore={updateScannedIdentityCore}
                    onUpdateRole={updateScannedRole}
                    onUpdateBulletSourceText={updateScannedBulletSourceText}
                    onUpdateSkillGroupLabel={updateScannedSkillGroupLabel}
                    onUpdateSkillItemName={updateScannedSkillItemName}
                    onUpdateEducationEntry={updateScannedEducationEntry}
                  />
                </>
              ) : (
                <div className="identity-empty">
                  <h3>No scanned resume yet</h3>
                  <p>Upload a text-based PDF to build a partial identity shell without a network call.</p>
                </div>
              )}
            </>
          ) : (
            <label className="identity-field">
              <span className="identity-label">Source Material</span>
              <textarea
                className="identity-textarea identity-textarea-lg"
                value={sourceMaterial}
                onChange={(event) => setSourceMaterial(event.target.value)}
                placeholder="Paste resume bullets, LinkedIn text, portfolio notes, or a rough narrative here."
              />
            </label>
          )}

          <label className="identity-field">
            <span className="identity-label">Correction Notes</span>
            <textarea
              className="identity-textarea"
              value={correctionNotes}
              onChange={(event) => setCorrectionNotes(event.target.value)}
              placeholder="Use this after the first draft to mark what is wrong, missing, or overstated."
            />
          </label>
        </section>

        <section className="identity-card">
          <div className="identity-card-header">
            <div>
              <h2>Identity Model Builder</h2>
              <p>Validate the current draft JSON, then apply it as a replace or merge operation.</p>
            </div>
            <div className="identity-card-actions">
              <button className="identity-btn" type="button" onClick={handleValidateDraft}>
                <ShieldCheck size={16} />
                Validate Draft
              </button>
              <button
                className="identity-btn"
                type="button"
                onClick={() => handleApply('merge')}
                disabled={!draftDocument.trim()}
              >
                <GitMerge size={16} />
                Merge Draft
              </button>
              <button
                className="identity-btn identity-btn-primary"
                type="button"
                onClick={() => handleApply('replace')}
                disabled={!draftDocument.trim()}
              >
                <RefreshCcw size={16} />
                Replace Identity
              </button>
            </div>
          </div>

          <div className="identity-stats">
            <div className="identity-stat" aria-label={'Roles: ' + (counts?.roles ?? 0)}>
              <span className="identity-stat-label">Roles</span>
              <strong>{counts?.roles ?? 0}</strong>
            </div>
            <div className="identity-stat" aria-label={'Bullets: ' + (counts?.bullets ?? 0)}>
              <span className="identity-stat-label">Bullets</span>
              <strong>{counts?.bullets ?? 0}</strong>
            </div>
            <div className="identity-stat" aria-label={'Profiles: ' + (counts?.profiles ?? 0)}>
              <span className="identity-stat-label">Profiles</span>
              <strong>{counts?.profiles ?? 0}</strong>
            </div>
            <div className="identity-stat" aria-label={'Projects: ' + (counts?.projects ?? 0)}>
              <span className="identity-stat-label">Projects</span>
              <strong>{counts?.projects ?? 0}</strong>
            </div>
            <div className="identity-stat" aria-label={'Skill Groups: ' + (counts?.skillGroups ?? 0)}>
              <span className="identity-stat-label">Skill Groups</span>
              <strong>{counts?.skillGroups ?? 0}</strong>
            </div>
          </div>

          <label className="identity-field">
            <span className="identity-label">Draft JSON</span>
            <textarea
              className="identity-textarea identity-textarea-code"
              value={draftDocument}
              onChange={(event) => setDraftDocument(event.target.value)}
              placeholder='{"version": 3, "...": "..."}'
            />
          </label>

          <div className="identity-card-actions">
            <button
              className="identity-btn identity-btn-primary"
              type="button"
              onClick={handlePushToBuild}
              disabled={!currentIdentity}
            >
              <ArrowRight size={16} />
              Push To Build
            </button>
          </div>
        </section>
      </div>

      <div className="identity-grid">
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
      </div>
    </div>
  )
}
