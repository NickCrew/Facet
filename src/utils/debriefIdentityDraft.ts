import {
  importProfessionalIdentity,
  type ProfessionalIdentityV3,
  type ProfessionalRoleBullet,
} from '../identity/schema'
import type {
  DebriefGenerationResult,
  DebriefIdentityNewBullet,
  DebriefQuestionReview,
} from '../types/debrief'
import type {
  IdentityAssumptionTag,
  IdentityDraftBullet,
  IdentityExtractionDraft,
} from '../types/identity'

const normalizeTags = (tags: string[]): string[] => {
  const next: string[] = []
  const seen = new Set<string>()
  for (const rawTag of tags) {
    const tag = rawTag.trim().toLowerCase()
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    next.push(tag)
  }
  return next
}

const mergeUniqueStrings = (current: string[], incoming: string[]): string[] => {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const rawEntry of [...current, ...incoming]) {
    const entry = rawEntry.trim()
    const key = entry.toLowerCase()
    if (!entry || seen.has(key)) continue
    seen.add(key)
    merged.push(entry)
  }

  return merged
}

const defaultRewrite = (bullet: ProfessionalRoleBullet): string =>
  [bullet.problem, bullet.action, bullet.outcome, ...bullet.impact].filter(Boolean).join(' ')

const defaultAssumptions = (): IdentityAssumptionTag[] => [{ label: 'debrief', confidence: 'confirmed' }]

const buildNewBulletDraft = (
  roleLabel: string,
  roleId: string,
  newBullet: DebriefIdentityNewBullet,
): IdentityDraftBullet => ({
  roleId,
  roleLabel,
  bulletId: newBullet.bullet.id,
  rewrite: newBullet.rewrite?.trim() || defaultRewrite(newBullet.bullet),
  tags: normalizeTags(newBullet.bullet.tags),
  assumptions: newBullet.assumptions && newBullet.assumptions.length > 0
    ? newBullet.assumptions
    : defaultAssumptions(),
})

export const buildDebriefIdentityDraft = (
  currentIdentity: ProfessionalIdentityV3,
  result: DebriefGenerationResult,
): IdentityExtractionDraft => {
  const updatedIdentity: ProfessionalIdentityV3 = structuredClone(currentIdentity)
  const rewrites = [...result.identityPatch.rewrites]

  if (result.identityPatch.updatedInterviewStyle) {
    const patch = result.identityPatch.updatedInterviewStyle
    updatedIdentity.self_model.interview_style = {
      strengths: patch.strengths
        ? mergeUniqueStrings(
            updatedIdentity.self_model.interview_style.strengths,
            patch.strengths,
          )
        : updatedIdentity.self_model.interview_style.strengths,
      weaknesses: patch.weaknesses
        ? mergeUniqueStrings(
            updatedIdentity.self_model.interview_style.weaknesses,
            patch.weaknesses,
          )
        : updatedIdentity.self_model.interview_style.weaknesses,
      prep_strategy:
        patch.prep_strategy?.trim() || updatedIdentity.self_model.interview_style.prep_strategy,
    }
  }

  for (const update of result.identityPatch.bulletUpdates) {
    const role = updatedIdentity.roles.find((entry) => entry.id === update.roleId)
    const draftRole = currentIdentity.roles.find((entry) => entry.id === update.roleId)
    const bullet = role?.bullets.find((entry) => entry.id === update.bulletId)
    if (!role || !bullet) continue

    bullet.tags = normalizeTags([...bullet.tags, ...update.addTags])
    bullet.impact = mergeUniqueStrings(bullet.impact, update.impactAdditions)
    if (update.portfolioDive !== undefined) {
      bullet.portfolio_dive = update.portfolioDive
    }

    const existingRewrite = rewrites.find(
      (entry) => entry.roleId === update.roleId && entry.bulletId === update.bulletId,
    )
    if (!existingRewrite) {
      rewrites.push({
        roleId: update.roleId,
        roleLabel: draftRole ? `${draftRole.company} — ${draftRole.title}` : role.company,
        bulletId: update.bulletId,
        rewrite: defaultRewrite(bullet),
        tags: normalizeTags(bullet.tags),
        assumptions: defaultAssumptions(),
      })
    }
  }

  for (const newBullet of result.identityPatch.newBullets) {
    const role = updatedIdentity.roles.find((entry) => entry.id === newBullet.roleId)
    const draftRole = currentIdentity.roles.find((entry) => entry.id === newBullet.roleId)
    if (!role) continue
    if (role.bullets.some((entry) => entry.id === newBullet.bullet.id)) continue

    role.bullets.push({
      ...newBullet.bullet,
      tags: normalizeTags(newBullet.bullet.tags),
      impact: mergeUniqueStrings([], newBullet.bullet.impact),
      technologies: mergeUniqueStrings([], newBullet.bullet.technologies),
    })

    rewrites.push(
      buildNewBulletDraft(
        draftRole ? `${draftRole.company} — ${draftRole.title}` : role.company,
        newBullet.roleId,
        newBullet,
      ),
    )
  }

  const normalized = importProfessionalIdentity(updatedIdentity)

  return {
    generatedAt: new Date().toISOString(),
    summary: result.identityPatch.summary,
    followUpQuestions: result.identityPatch.followUpQuestions.map((entry) => entry.trim()).filter(Boolean),
    identity: normalized.data,
    bullets: rewrites,
    warnings: [...result.warnings, ...normalized.warnings],
  }
}

const flattenQuestions = (questions: DebriefQuestionReview[]): string[] =>
  questions.map((entry) => entry.question.trim()).filter(Boolean)

interface DebriefCorrectionNoteSource {
  summary: string
  correctionNotes: string[]
  followUpQuestions?: string[]
  questionsAsked: DebriefQuestionReview[]
}

export const buildDebriefCorrectionNotes = (
  source: DebriefCorrectionNoteSource,
  company: string,
  role: string,
): string => {
  const sections = [
    `Debrief: ${company} — ${role}`,
    source.summary,
    source.correctionNotes.length > 0
      ? 'Corrections\n' + source.correctionNotes.join('\n')
      : '',
    (source.followUpQuestions?.length ?? 0) > 0
      ? 'Follow-up Questions\n' + source.followUpQuestions?.join('\n')
      : '',
    flattenQuestions(source.questionsAsked).length > 0
      ? 'Questions Asked\n' + flattenQuestions(source.questionsAsked).join('\n')
      : '',
  ]

  return sections.filter(Boolean).join('\n\n')
}
