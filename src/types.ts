export type VectorId = string
export type VectorSelection = VectorId | 'all'

export type ComponentPriority = 'must' | 'strong' | 'optional' | 'exclude'
export type IncludedPriority = Exclude<ComponentPriority, 'exclude'>

export const PRIORITY_ORDER: IncludedPriority[] = ['must', 'strong', 'optional']
export const DEFAULT_TARGET_PAGES = 2

export type PriorityByVector = Record<VectorId, ComponentPriority>
export type TextVariantMap = Partial<Record<VectorId, string>>
export type VariantSelection = VectorId | 'default'
export type SkillGroupOrder = { default?: number } & Record<string, number | undefined>

export interface ResumeLink {
  label: string
  url: string
}

export interface ResumeMeta {
  name: string
  email: string
  phone: string
  location: string
  links: ResumeLink[]
}

export interface ResumeVector {
  id: VectorId
  label: string
  color: string
}

export interface TargetLineComponent {
  id: string
  vectors: PriorityByVector
  text: string
  variants?: TextVariantMap
}

export interface ProfileComponent {
  id: string
  vectors: PriorityByVector
  text: string
  variants?: TextVariantMap
}

export interface SkillGroupComponent {
  id: string
  label: string
  content: string
  order: SkillGroupOrder
}

export interface RoleBulletComponent {
  id: string
  vectors: PriorityByVector
  text: string
  variants?: TextVariantMap
}

export interface RoleComponent {
  id: string
  company: string
  title: string
  dates: string
  subtitle?: string | null
  bullets: RoleBulletComponent[]
}

export interface ProjectComponent {
  id: string
  name: string
  url?: string
  vectors: PriorityByVector
  text: string
  variants?: TextVariantMap
}

export interface EducationEntry {
  school: string
  location: string
  degree: string
  year: string
}

export interface ResumeData {
  version: number
  meta: ResumeMeta
  vectors: ResumeVector[]
  target_lines: TargetLineComponent[]
  profiles: ProfileComponent[]
  skill_groups: SkillGroupComponent[]
  roles: RoleComponent[]
  projects: ProjectComponent[]
  education: EducationEntry[]
}

export type ManualComponentOverrides = Record<string, boolean>
export type ManualVariantOverrides = Record<string, VariantSelection>
export type RoleBulletOrderMap = Record<string, string[]>

export interface AssembledTextComponent {
  id: string
  text: string
  priority: IncludedPriority
}

export interface AssembledSkillGroup {
  id: string
  label: string
  content: string
}

export interface AssembledRoleBullet {
  id: string
  text: string
  priority: IncludedPriority
}

export interface AssembledRole {
  id: string
  company: string
  title: string
  dates: string
  subtitle?: string | null
  bullets: AssembledRoleBullet[]
}

export interface AssembledProject {
  id: string
  name: string
  url?: string
  text: string
  priority: IncludedPriority
}

export interface AssembledResume {
  selectedVector: VectorSelection
  header: ResumeMeta
  targetLine?: AssembledTextComponent
  profile?: AssembledTextComponent
  skillGroups: AssembledSkillGroup[]
  roles: AssembledRole[]
  projects: AssembledProject[]
  education: EducationEntry[]
}

export type EngineWarningCode = 'must_over_budget' | 'over_budget_after_trim'

export interface EngineWarning {
  code: EngineWarningCode
  message: string
}

export interface AssemblyOptions {
  selectedVector?: VectorSelection
  manualOverrides?: ManualComponentOverrides
  variantOverrides?: ManualVariantOverrides
  bulletOrderByRole?: RoleBulletOrderMap
  targetPages?: number
  trimToPageBudget?: boolean
}

export interface AssemblyResult {
  resume: AssembledResume
  targetPages: number
  estimatedPages: number
  mustOnlyEstimatedPages: number
  trimmedBulletIds: string[]
  warnings: EngineWarning[]
}

// UI aliases
export type Priority = ComponentPriority
export type VectorDef = ResumeVector
export type SkillGroup = SkillGroupComponent
export type Role = RoleComponent
