import type { ProfessionalIdentityV3 } from '../identity/schema'

export type IdentityConfidence = 'stated' | 'confirmed' | 'guessing' | 'corrected'

export interface IdentityAssumptionTag {
  label: string
  confidence: IdentityConfidence
}

export interface IdentityDraftBullet {
  roleId: string
  roleLabel: string
  bulletId: string
  rewrite: string
  tags: string[]
  assumptions: IdentityAssumptionTag[]
}

export interface IdentityExtractionDraft {
  generatedAt: string
  summary: string
  followUpQuestions: string[]
  identity: ProfessionalIdentityV3
  bullets: IdentityDraftBullet[]
  warnings: string[]
}

export type IdentityApplyMode = 'replace' | 'merge'

export interface IdentityApplyResult {
  data: ProfessionalIdentityV3
  warnings: string[]
  summary: string
  details: string[]
}

export type IdentityChangeAction = 'draft-generated' | 'draft-applied' | 'identity-imported'

export interface IdentityChangeLogEntry {
  id: string
  createdAt: string
  action: IdentityChangeAction
  summary: string
  details: string[]
  mode?: IdentityApplyMode
}
