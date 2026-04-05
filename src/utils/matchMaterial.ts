import { assembleResume } from '../engine/assembler'
import type { ResumeData, ResumeVector } from '../types'
import type { MatchReport } from '../types/match'
import { applyMatchReportToResumeData } from './matchAssembler'

export interface MatchMaterialContext {
  company: string
  role: string
  vector: ResumeVector
  jobDescription: string
  assembled: ReturnType<typeof assembleResume>['resume']
  summary: string
  matchScore: number
  topSkillLabels: string[]
  positioningRecommendations: string[]
  gapFocus: string[]
  skillMatch?: string
  positioning?: string
  notes?: string
  briefingNotes: string
}

const joinParagraphs = (parts: Array<string | undefined>): string | undefined => {
  const filtered = parts.map((part) => part?.trim()).filter(Boolean)
  return filtered.length > 0 ? filtered.join('\n\n') : undefined
}

export const createMatchMaterialContext = (
  resumeData: ResumeData,
  report: MatchReport,
): MatchMaterialContext | null => {
  const synthesized = applyMatchReportToResumeData(resumeData, report)
  const vector = synthesized.data.vectors.find((entry) => entry.id === synthesized.vectorId)
  if (!vector) {
    return null
  }

  const assembled = assembleResume(synthesized.data, {
    selectedVector: vector.id,
    manualOverrides: synthesized.data.manualOverrides?.[vector.id] ?? {},
    bulletOrderByRole: synthesized.data.bulletOrders?.[vector.id] ?? {},
    targetPages: 2,
    variables: synthesized.data.variables ?? {},
  }).resume

  const topSkillLabels = report.topSkills.slice(0, 6).map((asset) => asset.label.trim()).filter(Boolean)
  const positioningRecommendations = report.positioningRecommendations.map((entry) => entry.trim()).filter(Boolean)
  const gapFocus = report.gapFocus.map((entry) => entry.trim()).filter(Boolean)
  const advantageNotes = report.advantages.slice(0, 3).map((entry) => entry.claim.trim()).filter(Boolean)
  const gapNotes = report.gaps
    .slice(0, 4)
    .map((entry) => [entry.label.trim(), entry.reason.trim()].filter(Boolean).join(': '))
    .filter(Boolean)

  const positioning = joinParagraphs([report.summary, ...positioningRecommendations])
  const notes = joinParagraphs([
    advantageNotes.length > 0 ? 'Advantages\n' + advantageNotes.join('\n') : undefined,
    gapNotes.length > 0 ? 'Gap focus\n' + gapNotes.join('\n') : undefined,
  ])

  return {
    company: report.company.trim() || 'Target Company',
    role: report.role.trim() || vector.label,
    vector,
    jobDescription: report.jobDescription,
    assembled,
    summary: report.summary,
    matchScore: report.matchScore,
    topSkillLabels,
    positioningRecommendations,
    gapFocus,
    skillMatch: topSkillLabels.length > 0 ? topSkillLabels.join(', ') : undefined,
    positioning,
    notes,
    briefingNotes: joinParagraphs([positioning, notes]) ?? '',
  }
}
