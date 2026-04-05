export type MatchRequirementPriority = 'core' | 'important' | 'supporting'

export type MatchAssetKind = 'bullet' | 'skill' | 'project' | 'profile' | 'philosophy'

export type MatchGapSeverity = 'high' | 'medium' | 'low'

export interface MatchRequirement {
  id: string
  label: string
  priority: MatchRequirementPriority
  evidence: string
  tags: string[]
  keywords: string[]
}

export interface MatchAdvantageHypothesis {
  id: string
  claim: string
  requirementIds: string[]
}

export interface MatchRequirementCoverage extends MatchRequirement {
  coverageScore: number
  matchedAssetCount: number
  matchedTags: string[]
}

export interface MatchAssetScore {
  kind: MatchAssetKind
  id: string
  label: string
  sourceLabel: string
  text: string
  tags: string[]
  matchedTags: string[]
  matchedKeywords: string[]
  matchedRequirementIds: string[]
  score: number
}

export interface MatchGap {
  requirementId: string
  label: string
  severity: MatchGapSeverity
  reason: string
  tags: string[]
}

export interface MatchAdvantage {
  id: string
  claim: string
  requirementIds: string[]
  evidence: MatchAssetScore[]
}

export interface JdMatchExtraction {
  summary: string
  company: string
  role: string
  requirements: MatchRequirement[]
  advantageHypotheses: MatchAdvantageHypothesis[]
  positioningRecommendations: string[]
  gapFocus: string[]
  warnings: string[]
}

export interface PreparedMatchJobDescription {
  content: string
  wordCount: number
  truncated: boolean
}

export interface MatchReport {
  generatedAt: string
  identityVersion: number
  company: string
  role: string
  summary: string
  jobDescription: string
  matchScore: number
  requirements: MatchRequirementCoverage[]
  topBullets: MatchAssetScore[]
  topSkills: MatchAssetScore[]
  topProjects: MatchAssetScore[]
  topProfiles: MatchAssetScore[]
  topPhilosophy: MatchAssetScore[]
  gaps: MatchGap[]
  advantages: MatchAdvantage[]
  positioningRecommendations: string[]
  gapFocus: string[]
  warnings: string[]
}

export interface MatchHistoryEntry {
  id: string
  createdAt: string
  company: string
  role: string
  matchScore: number
  requirementCount: number
  gapCount: number
  summary: string
}
