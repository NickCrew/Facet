import type { ProfessionalIdentityV3 } from '../identity/schema'
import type { MatchAssetScore, MatchGap, MatchReport } from '../types/match'
import type { RecruiterCard } from '../types/recruiter'

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`

const summarizeAsset = (asset: MatchAssetScore): string => {
  const source = asset.sourceLabel.trim()
  const text = asset.text.trim()
  return source ? `${source}: ${text}` : text
}

const summarizeGap = (gap: MatchGap): string =>
  [gap.label.trim(), gap.reason.trim()].filter(Boolean).join(': ')

const buildCandidateTitle = (identity: ProfessionalIdentityV3, report: MatchReport): string =>
  identity.identity.title?.trim() || report.role.trim() || 'Candidate'

const buildCandidateName = (identity: ProfessionalIdentityV3): string =>
  identity.identity.display_name?.trim() || identity.identity.name.trim()

const takeUnique = (values: string[], limit: number): string[] => {
  const seen = new Set<string>()
  const next: string[] = []

  for (const rawValue of values) {
    const value = rawValue.trim()
    const key = value.toLowerCase()
    if (!value || seen.has(key)) continue
    seen.add(key)
    next.push(value)
    if (next.length >= limit) break
  }

  return next
}

export const createRecruiterCard = ({
  id,
  identity,
  report,
}: {
  id: string
  identity: ProfessionalIdentityV3
  report: MatchReport
}): RecruiterCard => {
  const candidateName = buildCandidateName(identity)
  const candidateTitle = buildCandidateTitle(identity, report)
  const topSkillLabels = takeUnique(report.topSkills.map((asset) => asset.label), 6)
  const topReasons = takeUnique(
    [
      ...report.advantages.map((advantage) => advantage.claim),
      ...report.positioningRecommendations,
      ...report.requirements
        .filter((requirement) => requirement.coverageScore >= 0.65)
        .map(
          (requirement) =>
            `${requirement.label} covered with ${formatPercent(requirement.coverageScore)} confidence`,
        ),
    ],
    5,
  )
  const proofPoints = takeUnique(
    [...report.topBullets, ...report.topProjects].map(summarizeAsset),
    5,
  )
  const likelyConcerns = takeUnique(
    report.gaps
      .filter((gap) => gap.severity === 'high' || gap.severity === 'medium')
      .map(summarizeGap),
    4,
  )
  const gapBridges = takeUnique(
    [
      ...report.gapFocus,
      ...report.positioningRecommendations.filter(
        (entry) =>
          !topReasons.some((reason) => reason.toLowerCase() === entry.trim().toLowerCase()),
      ),
    ],
    4,
  )

  const recruiterHook =
    `${candidateName} is a ${candidateTitle} with a ${formatPercent(report.matchScore)} match for ${report.role} at ${report.company}.`
  const suggestedIntro = [
    recruiterHook,
    topSkillLabels.length > 0 ? `Lead with ${topSkillLabels.slice(0, 3).join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    id,
    generatedAt: new Date().toISOString(),
    company: report.company.trim() || 'Target Company',
    role: report.role.trim() || 'Target Role',
    candidateName,
    candidateTitle,
    matchScore: report.matchScore,
    summary: report.summary.trim(),
    recruiterHook,
    suggestedIntro,
    topReasons,
    proofPoints,
    skillHighlights: topSkillLabels,
    positioningAngles: takeUnique(report.positioningRecommendations, 5),
    likelyConcerns,
    gapBridges,
    notes: [
      report.warnings.length > 0 ? `Warnings: ${report.warnings.join(' | ')}` : '',
      likelyConcerns.length > 0 ? 'Keep gaps honest and redirect to proven strengths.' : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  }
}
