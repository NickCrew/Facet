import type { ProfessionalIdentityV3 } from '../identity/schema'
import type {
  JdMatchExtraction,
  MatchAdvantage,
  MatchAdvantageHypothesis,
  MatchAssetKind,
  MatchAssetScore,
  MatchGap,
  MatchGapSeverity,
  MatchHistoryEntry,
  MatchReport,
  MatchRequirement,
  MatchRequirementCoverage,
  MatchRequirementPriority,
  PreparedMatchJobDescription,
} from '../types/match'
import { callLlmProxy, extractJsonBlock, JsonExtractionError } from './llmProxy'
import { createId, slugify } from './idUtils'

const JD_MATCH_MODEL = 'sonnet'
const MAX_JD_WORDS = 1200
const PRIORITY_WEIGHTS: Record<MatchRequirementPriority, number> = {
  core: 3,
  important: 2,
  supporting: 1,
}

interface FlattenedMatchAsset {
  kind: MatchAssetKind
  id: string
  label: string
  sourceLabel: string
  text: string
  tags: string[]
  searchTerms: string[]
}

interface RequirementMatchDetail {
  requirementId: string
  rawScore: number
  matchedTags: string[]
  matchedKeywords: string[]
}

const JD_MATCH_SYSTEM_PROMPT = `You are Facet's JD Matching Agent.
Read a job description and decompose it into structured requirements that can be scored against a Professional Identity model.
Return JSON only with this exact top-level shape:
{
  "summary": string,
  "company": string,
  "role": string,
  "requirements": [
    {
      "id": string,
      "label": string,
      "priority": "core" | "important" | "supporting",
      "evidence": string,
      "tags": string[],
      "keywords": string[]
    }
  ],
  "advantage_hypotheses": [
    {
      "id": string,
      "claim": string,
      "requirement_ids": string[]
    }
  ],
  "positioning_recommendations": string[],
  "gap_focus": string[],
  "warnings": string[]
}
Rules:
- Requirements should describe real hiring needs, not generic resume advice.
- Prefer tags from the provided candidate vocabulary when they fit.
- Tags should be short normalized concepts like "platform", "kubernetes", "pm-communication", "linux", "observability".
- Keywords should be literal JD terms worth preserving for matching.
- Keep advantage hypotheses specific to this JD. They should point to combinations of requirements, not generic praise.
- Use 4-8 requirements unless the JD is unusually sparse.
- Do not wrap the JSON in markdown fences.`

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const assertRecord = (value: unknown, context: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(`${context} must be an object.`)
  }

  return value
}

const assertString = (value: unknown, context: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`${context} must be a string.`)
  }

  return value
}

const assertStringArray = (value: unknown, context: string): string[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array.`)
  }

  return value.map((entry, index) => assertString(entry, `${context}[${index}]`))
}

const normalizeTag = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const dedupeNormalized = (values: string[]): string[] =>
  Array.from(new Set(values.map(normalizeTag).filter(Boolean)))

const tokenizeText = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2),
    ),
  )

const normalizePriority = (value: unknown, context: string): MatchRequirementPriority => {
  const priority = assertString(value, context)
  if (priority === 'core' || priority === 'important' || priority === 'supporting') {
    return priority
  }

  throw new Error(`${context} must be core, important, or supporting.`)
}

const normalizeRequirement = (value: unknown, index: number): MatchRequirement => {
  const record = assertRecord(value, `requirements[${index}]`)

  return {
    id: slugify(assertString(record.id, `requirements[${index}].id`)) || `requirement-${index + 1}`,
    label: assertString(record.label, `requirements[${index}].label`).trim(),
    priority: normalizePriority(record.priority, `requirements[${index}].priority`),
    evidence: assertString(record.evidence, `requirements[${index}].evidence`).trim(),
    tags: dedupeNormalized(assertStringArray(record.tags, `requirements[${index}].tags`)),
    keywords: Array.from(
      new Set(
        assertStringArray(record.keywords, `requirements[${index}].keywords`)
          .map((keyword) => keyword.trim())
          .filter(Boolean),
      ),
    ),
  }
}

const normalizeAdvantageHypothesis = (
  value: unknown,
  index: number,
): MatchAdvantageHypothesis => {
  const record = assertRecord(value, `advantage_hypotheses[${index}]`)

  return {
    id: slugify(assertString(record.id, `advantage_hypotheses[${index}].id`)) || `advantage-${index + 1}`,
    claim: assertString(record.claim, `advantage_hypotheses[${index}].claim`).trim(),
    requirementIds: Array.from(
      new Set(
        assertStringArray(
          record.requirement_ids,
          `advantage_hypotheses[${index}].requirement_ids`,
        )
          .map((entry) => slugify(entry))
          .filter(Boolean),
      ),
    ),
  }
}

const buildIdentityVocabulary = (identity: ProfessionalIdentityV3) => {
  const tagSet = new Set<string>()
  const keywordSet = new Set<string>()

  const collectTags = (values: string[]) => {
    for (const value of values) {
      const normalized = normalizeTag(value)
      if (normalized) {
        tagSet.add(normalized)
      }
    }
  }

  const collectKeywords = (value: string) => {
    for (const token of tokenizeText(value)) {
      keywordSet.add(token)
    }
  }

  collectKeywords(identity.identity.title ?? '')
  collectKeywords(identity.identity.thesis)

  for (const philosophy of identity.self_model.philosophy) {
    collectTags(philosophy.tags)
    collectKeywords(philosophy.text)
  }

  for (const profile of identity.profiles) {
    collectTags(profile.tags)
    collectKeywords(profile.text)
  }

  for (const group of identity.skills.groups) {
    collectKeywords(group.label)
    for (const item of group.items) {
      collectTags(item.tags)
      collectTags([item.name])
      collectKeywords(item.name)
    }
  }

  for (const role of identity.roles) {
    collectKeywords(role.company)
    collectKeywords(role.title)
    for (const bullet of role.bullets) {
      collectTags(bullet.tags)
      collectTags(bullet.technologies)
      collectKeywords(bullet.problem)
      collectKeywords(bullet.action)
      collectKeywords(bullet.outcome)
      collectKeywords(bullet.impact.join(' '))
    }
  }

  for (const project of identity.projects) {
    collectTags(project.tags)
    collectTags([project.name])
    collectKeywords(project.name)
    collectKeywords(project.description)
  }

  return {
    tags: Array.from(tagSet).sort(),
    keywords: Array.from(keywordSet).sort(),
  }
}

const buildIdentityContext = (identity: ProfessionalIdentityV3) => ({
  identity: {
    name: identity.identity.display_name ?? identity.identity.name,
    title: identity.identity.title ?? '',
    thesis: identity.identity.thesis,
  },
  philosophy: identity.self_model.philosophy.map((entry) => ({
    id: entry.id,
    text: entry.text,
    tags: entry.tags,
  })),
  profiles: identity.profiles.map((profile) => ({
    id: profile.id,
    text: profile.text,
    tags: profile.tags,
  })),
  skills: identity.skills.groups.map((group) => ({
    id: group.id,
    label: group.label,
    items: group.items.map((item) => ({
      name: item.name,
      tags: item.tags,
    })),
  })),
  roles: identity.roles.map((role) => ({
    id: role.id,
    company: role.company,
    title: role.title,
    bullets: role.bullets.map((bullet) => ({
      id: bullet.id,
      label: bullet.impact[0] ?? bullet.outcome,
      tags: bullet.tags,
      technologies: bullet.technologies,
    })),
  })),
  projects: identity.projects.map((project) => ({
    id: project.id,
    name: project.name,
    tags: project.tags,
  })),
})

const flattenIdentityAssets = (identity: ProfessionalIdentityV3): FlattenedMatchAsset[] => {
  const assets: FlattenedMatchAsset[] = []

  for (const role of identity.roles) {
    for (const bullet of role.bullets) {
      const label =
        bullet.impact[0]?.trim() || bullet.outcome.trim() || bullet.action.trim() || bullet.problem.trim()
      const text = [bullet.problem, bullet.action, bullet.outcome].map((value) => value.trim()).filter(Boolean).join(' ')
      assets.push({
        kind: 'bullet',
        id: bullet.id,
        label,
        sourceLabel: `${role.company} - ${role.title}`,
        text,
        tags: dedupeNormalized([...bullet.tags, ...bullet.technologies]),
        searchTerms: tokenizeText(`${label} ${text} ${bullet.impact.join(' ')} ${bullet.technologies.join(' ')}`),
      })
    }
  }

  for (const group of identity.skills.groups) {
    for (const item of group.items) {
      assets.push({
        kind: 'skill',
        id: `${group.id}::${slugify(item.name)}`,
        label: item.name,
        sourceLabel: group.label,
        text: item.proficiency ? `${item.name} (${item.proficiency})` : item.name,
        tags: dedupeNormalized([...item.tags, item.name, group.label]),
        searchTerms: tokenizeText(`${group.label} ${item.name} ${item.proficiency ?? ''}`),
      })
    }
  }

  for (const project of identity.projects) {
    assets.push({
      kind: 'project',
      id: project.id,
      label: project.name,
      sourceLabel: 'Project',
      text: project.description,
      tags: dedupeNormalized([...project.tags, project.name]),
      searchTerms: tokenizeText(`${project.name} ${project.description}`),
    })
  }

  for (const profile of identity.profiles) {
    assets.push({
      kind: 'profile',
      id: profile.id,
      label: profile.id,
      sourceLabel: 'Profile',
      text: profile.text,
      tags: dedupeNormalized(profile.tags),
      searchTerms: tokenizeText(profile.text),
    })
  }

  for (const philosophy of identity.self_model.philosophy) {
    assets.push({
      kind: 'philosophy',
      id: philosophy.id,
      label: philosophy.text.slice(0, 72),
      sourceLabel: 'Philosophy',
      text: philosophy.text,
      tags: dedupeNormalized(philosophy.tags),
      searchTerms: tokenizeText(philosophy.text),
    })
  }

  return assets
}

const scoreAssetAgainstRequirement = (
  asset: FlattenedMatchAsset,
  requirement: MatchRequirement,
): RequirementMatchDetail => {
  const matchedTags = requirement.tags.filter((tag) => asset.tags.includes(tag))
  const requirementKeywords = requirement.keywords.map((keyword) => keyword.toLowerCase())
  const matchedKeywords = requirementKeywords.filter(
    (keyword) =>
      asset.searchTerms.includes(keyword) ||
      asset.tags.includes(normalizeTag(keyword)),
  )

  const tagCoverage =
    matchedTags.length === 0 ? 0 : matchedTags.length / Math.max(1, Math.min(requirement.tags.length, 4))
  const keywordCoverage =
    matchedKeywords.length === 0
      ? 0
      : matchedKeywords.length / Math.max(1, Math.min(requirementKeywords.length, 4))

  const synergyBoost = matchedTags.length > 0 && matchedKeywords.length > 0 ? 0.1 : 0
  const rawScore = Math.min(1, tagCoverage * 0.75 + keywordCoverage * 0.25 + synergyBoost)

  return {
    requirementId: requirement.id,
    rawScore,
    matchedTags,
    matchedKeywords,
  }
}

const roundScore = (value: number): number => Math.round(value * 1000) / 1000

const rankAssets = (
  assets: FlattenedMatchAsset[],
  requirements: MatchRequirement[],
): {
  scoredAssets: MatchAssetScore[]
  requirements: MatchRequirementCoverage[]
  matchScore: number
} => {
  const totalWeight = requirements.reduce((sum, requirement) => sum + PRIORITY_WEIGHTS[requirement.priority], 0)
  const priorityByRequirementId = new Map(
    requirements.map((requirement) => [requirement.id, requirement.priority] as const),
  )

  const scoredAssets: MatchAssetScore[] = assets
    .map((asset) => {
      const details = requirements
        .map((requirement) => scoreAssetAgainstRequirement(asset, requirement))
        .filter((detail) => detail.rawScore > 0)
      const weightedScore = details.reduce(
        (total, detail) =>
          total +
          detail.rawScore *
            PRIORITY_WEIGHTS[priorityByRequirementId.get(detail.requirementId) ?? 'supporting'],
        0,
      )

      return {
        kind: asset.kind,
        id: asset.id,
        label: asset.label,
        sourceLabel: asset.sourceLabel,
        text: asset.text,
        tags: asset.tags,
        matchedTags: Array.from(new Set(details.flatMap((detail) => detail.matchedTags))),
        matchedKeywords: Array.from(new Set(details.flatMap((detail) => detail.matchedKeywords))),
        matchedRequirementIds: Array.from(new Set(details.map((detail) => detail.requirementId))),
        score: totalWeight > 0 ? roundScore(weightedScore / totalWeight) : 0,
      }
    })
    .filter((asset) => asset.score > 0)
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))

  const requirementCoverage: MatchRequirementCoverage[] = requirements.map((requirement) => {
    const matches = assets
      .map((asset) => scoreAssetAgainstRequirement(asset, requirement))
      .filter((detail) => detail.rawScore > 0)
    const coverageScore = matches.reduce((best, detail) => Math.max(best, detail.rawScore), 0)
    return {
      ...requirement,
      coverageScore: roundScore(coverageScore),
      matchedAssetCount: matches.filter((detail) => detail.rawScore >= 0.25).length,
      matchedTags: Array.from(new Set(matches.flatMap((detail) => detail.matchedTags))),
    }
  })

  const achievedWeight = requirementCoverage.reduce(
    (sum, requirement) => sum + requirement.coverageScore * PRIORITY_WEIGHTS[requirement.priority],
    0,
  )

  return {
    scoredAssets,
    requirements: requirementCoverage,
    matchScore: totalWeight > 0 ? roundScore(achievedWeight / totalWeight) : 0,
  }
}

const buildGapReason = (requirement: MatchRequirementCoverage): string => {
  if (requirement.coverageScore < 0.15) {
    return `No strong evidence found for ${requirement.label} in the current identity model.`
  }

  return `Only partial evidence was found for ${requirement.label}; the identity model may need stronger stories or clearer tags.`
}

const buildGaps = (requirements: MatchRequirementCoverage[]): MatchGap[] =>
  requirements
    .filter((requirement) => requirement.coverageScore < 0.45)
    .map((requirement) => {
      let severity: MatchGapSeverity = 'low'
      if (requirement.priority === 'core') {
        severity = requirement.coverageScore < 0.15 ? 'high' : 'medium'
      } else if (requirement.priority === 'important') {
        severity = requirement.coverageScore < 0.15 ? 'medium' : 'low'
      }

      return {
        requirementId: requirement.id,
        label: requirement.label,
        severity,
        reason: buildGapReason(requirement),
        tags: requirement.tags,
      }
    })

const buildFallbackAdvantages = (
  requirements: MatchRequirementCoverage[],
  assets: MatchAssetScore[],
): MatchAdvantage[] =>
  requirements
    .filter((requirement) => requirement.coverageScore >= 0.6)
    .slice(0, 2)
    .map((requirement, index) => ({
      id: `fallback-advantage-${index + 1}`,
      claim: `You have credible evidence for ${requirement.label} that can be positioned confidently for this role.`,
      requirementIds: [requirement.id],
      evidence: assets.filter((asset) => asset.matchedRequirementIds.includes(requirement.id)).slice(0, 3),
    }))
    .filter((advantage) => advantage.evidence.length > 0)

const buildAdvantages = (
  hypotheses: MatchAdvantageHypothesis[],
  requirements: MatchRequirementCoverage[],
  assets: MatchAssetScore[],
): MatchAdvantage[] => {
  const advantages = hypotheses
    .map((hypothesis) => {
      const requirementIds = hypothesis.requirementIds.filter((requirementId) =>
        requirements.some((requirement) => requirement.id === requirementId),
      )
      const evidence = assets
        .filter((asset) =>
          asset.matchedRequirementIds.some((requirementId) => requirementIds.includes(requirementId)),
        )
        .slice(0, 4)

      return {
        id: hypothesis.id,
        claim: hypothesis.claim,
        requirementIds,
        evidence,
      }
    })
    .filter((advantage) => advantage.requirementIds.length > 0 && advantage.evidence.length > 0)

  return advantages.length > 0 ? advantages : buildFallbackAdvantages(requirements, assets)
}

const takeTopByKind = (
  assets: MatchAssetScore[],
  kind: MatchAssetKind,
  limit: number,
): MatchAssetScore[] => assets.filter((asset) => asset.kind === kind).slice(0, limit)

export const prepareMatchJobDescription = (raw: string): PreparedMatchJobDescription => {
  const words = raw.split(/\s+/).filter((word) => word.length > 0)
  const wordCount = words.length
  const truncated = wordCount > MAX_JD_WORDS

  return {
    content: words.slice(0, MAX_JD_WORDS).join(' '),
    wordCount,
    truncated,
  }
}

export const parseJdMatchExtractionResponse = (rawResponse: string): JdMatchExtraction => {
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJsonBlock(rawResponse))
  } catch (error) {
    if (error instanceof JsonExtractionError) {
      throw error
    }
    throw new Error(error instanceof Error ? error.message : 'Unable to parse JD match response.')
  }

  const root = assertRecord(parsed, 'jd match response')
  const requirementsValue = Array.isArray(root.requirements) ? root.requirements : []
  const hypothesesValue = Array.isArray(root.advantage_hypotheses) ? root.advantage_hypotheses : []

  return {
    summary: assertString(root.summary, 'summary').trim(),
    company: assertString(root.company ?? '', 'company').trim(),
    role: assertString(root.role ?? '', 'role').trim(),
    requirements: requirementsValue.map((entry, index) => normalizeRequirement(entry, index)),
    advantageHypotheses: hypothesesValue.map((entry, index) =>
      normalizeAdvantageHypothesis(entry, index),
    ),
    positioningRecommendations:
      root.positioning_recommendations === undefined
        ? []
        : assertStringArray(root.positioning_recommendations, 'positioning_recommendations')
            .map((entry) => entry.trim())
            .filter(Boolean),
    gapFocus:
      root.gap_focus === undefined
        ? []
        : assertStringArray(root.gap_focus, 'gap_focus')
            .map((entry) => entry.trim())
            .filter(Boolean),
    warnings:
      root.warnings === undefined
        ? []
        : assertStringArray(root.warnings, 'warnings')
            .map((entry) => entry.trim())
            .filter(Boolean),
  }
}

export const createJobMatchReport = ({
  identity,
  prepared,
  extraction,
}: {
  identity: ProfessionalIdentityV3
  prepared: PreparedMatchJobDescription
  extraction: JdMatchExtraction
}): MatchReport => {
  const flattenedAssets = flattenIdentityAssets(identity)
  const ranked = rankAssets(flattenedAssets, extraction.requirements)
  const gaps = buildGaps(ranked.requirements)
  const advantages = buildAdvantages(extraction.advantageHypotheses, ranked.requirements, ranked.scoredAssets)
  const warnings = [
    ...extraction.warnings,
    ...(prepared.truncated ? [`Job description exceeded ${MAX_JD_WORDS} words and was truncated for analysis.`] : []),
  ]

  return {
    generatedAt: new Date().toISOString(),
    identityVersion: identity.version,
    company: extraction.company,
    role: extraction.role,
    summary: extraction.summary,
    jobDescription: prepared.content,
    matchScore: ranked.matchScore,
    requirements: ranked.requirements,
    topBullets: takeTopByKind(ranked.scoredAssets, 'bullet', 8),
    topSkills: takeTopByKind(ranked.scoredAssets, 'skill', 8),
    topProjects: takeTopByKind(ranked.scoredAssets, 'project', 4),
    topProfiles: takeTopByKind(ranked.scoredAssets, 'profile', 4),
    topPhilosophy: takeTopByKind(ranked.scoredAssets, 'philosophy', 4),
    gaps,
    advantages,
    positioningRecommendations: extraction.positioningRecommendations,
    gapFocus: extraction.gapFocus,
    warnings,
  }
}

const buildMatchPrompt = ({
  identity,
  prepared,
}: {
  identity: ProfessionalIdentityV3
  prepared: PreparedMatchJobDescription
}) => {
  const vocabulary = buildIdentityVocabulary(identity)
  const identityContext = buildIdentityContext(identity)

  return [
    'Job description:',
    prepared.content,
    '',
    'Candidate tag vocabulary:',
    JSON.stringify(vocabulary, null, 2),
    '',
    'Candidate identity outline:',
    JSON.stringify(identityContext, null, 2),
    '',
    'Return the structured JD match report input as JSON only.',
  ].join('\n')
}

export const analyzeIdentityJobMatch = async ({
  endpoint,
  identity,
  jobDescription,
}: {
  endpoint: string
  identity: ProfessionalIdentityV3
  jobDescription: string
}): Promise<MatchReport> => {
  const prepared = prepareMatchJobDescription(jobDescription)
  const rawResponse = await callLlmProxy(endpoint, JD_MATCH_SYSTEM_PROMPT, buildMatchPrompt({
    identity,
    prepared,
  }), {
    feature: 'match.jd-analysis',
    model: JD_MATCH_MODEL,
    temperature: 0.1,
    timeoutMs: 60000,
  })

  const extraction = parseJdMatchExtractionResponse(rawResponse)
  return createJobMatchReport({ identity, prepared, extraction })
}

export const createMatchHistoryEntry = (report: MatchReport): MatchHistoryEntry => ({
  id: createId('match-history'),
  createdAt: report.generatedAt,
  company: report.company,
  role: report.role,
  matchScore: report.matchScore,
  requirementCount: report.requirements.length,
  gapCount: report.gaps.length,
  summary: report.summary,
})
