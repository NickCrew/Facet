import {
  DEFAULT_TARGET_PAGES,
  type AssembledResume,
  type EngineWarning,
  type IncludedPriority,
} from '../types'

const DEFAULT_LINES_PER_PAGE = 58
const DEFAULT_CHARS_PER_LINE = 92
const CONTACT_CHARS_PER_LINE = 72

export interface PageBudgetOptions {
  targetPages?: number
  trim?: boolean
  linesPerPage?: number
}

export interface PageBudgetResult {
  resume: AssembledResume
  targetPages: number
  estimatedPages: number
  mustOnlyEstimatedPages: number
  trimmedBulletIds: string[]
  warnings: EngineWarning[]
}

const estimateWrappedLines = (text: string, charsPerLine = DEFAULT_CHARS_PER_LINE): number => {
  const compact = text.trim().replace(/\s+/g, ' ')
  if (compact.length === 0) {
    return 0
  }

  return Math.max(1, Math.ceil(compact.length / charsPerLine))
}

const estimateRoleLines = (resume: AssembledResume): number => {
  if (resume.roles.length === 0) {
    return 0
  }

  let lines = 1
  for (const role of resume.roles) {
    lines += 1
    if (role.subtitle) {
      lines += estimateWrappedLines(role.subtitle)
    }

    for (const bullet of role.bullets) {
      lines += Math.max(1, estimateWrappedLines(bullet.text, DEFAULT_CHARS_PER_LINE - 10))
    }
  }

  return lines
}

const cloneAssembledResume = (resume: AssembledResume): AssembledResume => ({
  selectedVector: resume.selectedVector,
  header: {
    ...resume.header,
    links: resume.header.links.map((link) => ({ ...link })),
  },
  targetLine: resume.targetLine ? { ...resume.targetLine } : undefined,
  profile: resume.profile ? { ...resume.profile } : undefined,
  skillGroups: resume.skillGroups.map((group) => ({ ...group })),
  roles: resume.roles.map((role) => ({
    ...role,
    bullets: role.bullets.map((bullet) => ({ ...bullet })),
  })),
  projects: resume.projects.map((project) => ({ ...project })),
  education: resume.education.map((entry) => ({ ...entry })),
})

const buildMustOnlySnapshot = (resume: AssembledResume): AssembledResume => ({
  ...cloneAssembledResume(resume),
  targetLine: resume.targetLine?.priority === 'must' ? { ...resume.targetLine } : undefined,
  profile: resume.profile?.priority === 'must' ? { ...resume.profile } : undefined,
  roles: resume.roles
    .map((role) => ({
      ...role,
      bullets: role.bullets.filter((bullet) => bullet.priority === 'must').map((bullet) => ({ ...bullet })),
    }))
    .filter((role) => role.bullets.length > 0),
  projects: resume.projects
    .filter((project) => project.priority === 'must')
    .map((project) => ({ ...project })),
})

const removeOldestBulletByPriority = (
  resume: AssembledResume,
  priority: Extract<IncludedPriority, 'optional' | 'strong'>,
): string | null => {
  for (let roleIndex = resume.roles.length - 1; roleIndex >= 0; roleIndex -= 1) {
    const role = resume.roles[roleIndex]

    for (let bulletIndex = role.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
      const bullet = role.bullets[bulletIndex]
      if (bullet.priority !== priority) {
        continue
      }

      role.bullets.splice(bulletIndex, 1)
      if (role.bullets.length === 0) {
        resume.roles.splice(roleIndex, 1)
      }

      return bullet.id
    }
  }

  return null
}

export const estimateResumeLines = (resume: AssembledResume): number => {
  const contactBits = [resume.header.location, resume.header.email, resume.header.phone, ...resume.header.links.map((link) => link.url)]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  let lines = 2
  lines += estimateWrappedLines(contactBits.join(' | '), CONTACT_CHARS_PER_LINE)

  if (resume.targetLine) {
    lines += estimateWrappedLines(resume.targetLine.text)
  }

  if (resume.profile) {
    lines += 1 + estimateWrappedLines(resume.profile.text)
  }

  if (resume.skillGroups.length > 0) {
    lines += 1
    for (const group of resume.skillGroups) {
      lines += Math.max(1, estimateWrappedLines(`${group.label}: ${group.content}`))
    }
  }

  lines += estimateRoleLines(resume)

  if (resume.projects.length > 0) {
    lines += 1
    for (const project of resume.projects) {
      const headline = project.url ? `${project.name} (${project.url})` : project.name
      lines += 1 + estimateWrappedLines(`${headline}: ${project.text}`)
    }
  }

  if (resume.education.length > 0) {
    lines += 1
    lines += resume.education.length
  }

  return Math.max(1, lines)
}

export const estimateResumePages = (
  resume: AssembledResume,
  linesPerPage = DEFAULT_LINES_PER_PAGE,
): number => {
  const safeLinesPerPage = Math.max(1, linesPerPage)
  return Math.max(1, Math.ceil(estimateResumeLines(resume) / safeLinesPerPage))
}

export const applyPageBudget = (
  resume: AssembledResume,
  options: PageBudgetOptions = {},
): PageBudgetResult => {
  const targetPages = options.targetPages ?? DEFAULT_TARGET_PAGES
  const shouldTrim = options.trim ?? true
  const linesPerPage = options.linesPerPage ?? DEFAULT_LINES_PER_PAGE
  const warnings: EngineWarning[] = []

  const workingResume = cloneAssembledResume(resume)
  const trimmedBulletIds: string[] = []

  let estimatedPages = estimateResumePages(workingResume, linesPerPage)
  const mustOnlyEstimatedPages = estimateResumePages(buildMustOnlySnapshot(workingResume), linesPerPage)

  if (mustOnlyEstimatedPages > targetPages) {
    warnings.push({
      code: 'must_over_budget',
      message: `Must-priority content alone is estimated at ${mustOnlyEstimatedPages} pages (target: ${targetPages}).`,
    })
  }

  if (shouldTrim && estimatedPages > targetPages) {
    const trimOrder: Array<Extract<IncludedPriority, 'optional' | 'strong'>> = ['optional', 'strong']

    for (const trimPriority of trimOrder) {
      while (estimatedPages > targetPages) {
        const removedId = removeOldestBulletByPriority(workingResume, trimPriority)
        if (!removedId) {
          break
        }

        trimmedBulletIds.push(removedId)
        estimatedPages = estimateResumePages(workingResume, linesPerPage)
      }
    }
  }

  if (estimatedPages > targetPages) {
    warnings.push({
      code: 'over_budget_after_trim',
      message: `Resume is still estimated at ${estimatedPages} pages after trimming (target: ${targetPages}).`,
    })
  }

  return {
    resume: workingResume,
    targetPages,
    estimatedPages,
    mustOnlyEstimatedPages,
    trimmedBulletIds,
    warnings,
  }
}
