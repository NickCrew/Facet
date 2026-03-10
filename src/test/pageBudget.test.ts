import { describe, expect, it } from 'vitest'
import { applyPageBudget, estimateResumePages } from '../engine/pageBudget'
import type { AssembledResume } from '../types'

function createResume(): AssembledResume {
  return {
    selectedVector: 'backend',
    header: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-111-2222',
      location: 'SF',
      links: [],
    },
    targetLine: {
      id: 'tl-1',
      text: 'Platform engineer',
      priority: 'must',
    },
    profile: {
      id: 'p-1',
      text: 'Profile text '.repeat(10),
      priority: 'must',
    },
    skillGroups: [],
    roles: [
      {
        id: 'new-role',
        company: 'New Co',
        title: 'Engineer',
        dates: '2024-Present',
        bullets: [
          { id: 'new-must', text: 'Must content '.repeat(20), priority: 'must' },
          { id: 'new-optional', text: 'Optional content '.repeat(20), priority: 'optional' },
        ],
      },
      {
        id: 'old-role',
        company: 'Old Co',
        title: 'Engineer',
        dates: '2020-2024',
        bullets: [
          { id: 'old-strong', text: 'Strong content '.repeat(20), priority: 'strong' },
          { id: 'old-optional', text: 'Optional content '.repeat(20), priority: 'optional' },
        ],
      },
    ],
    projects: [],
    education: [],
    certifications: [],
  }
}

describe('pageBudget', () => {
  it('trims optional before strong from the oldest role', () => {
    const resume = createResume()
    const result = applyPageBudget(resume, {
      targetPages: 1,
      linesPerPage: 8,
      trim: true,
    })

    expect(result.trimmedBulletIds.length).toBeGreaterThan(0)
    const oldOptionalIndex = result.trimmedBulletIds.indexOf('old-optional')
    const oldStrongIndex = result.trimmedBulletIds.indexOf('old-strong')

    expect(oldOptionalIndex).toBeGreaterThanOrEqual(0)
    expect(oldStrongIndex).toBeGreaterThanOrEqual(0)
    expect(oldOptionalIndex).toBeLessThan(oldStrongIndex)
    expect(result.resume.roles.flatMap((role) => role.bullets).some((bullet) => bullet.id === 'new-must')).toBe(true)
  })

  it('emits must-over-budget warning when must content exceeds target', () => {
    const resume = createResume()
    const result = applyPageBudget(resume, {
      targetPages: 1,
      linesPerPage: 4,
    })

    expect(result.warnings.some((warning) => warning.code === 'must_over_budget')).toBe(true)
  })

  it('does not trim when trim is disabled', () => {
    const resume = createResume()
    const before = resume.roles.flatMap((role) => role.bullets).length

    const result = applyPageBudget(resume, {
      targetPages: 1,
      linesPerPage: 8,
      trim: false,
    })

    expect(result.trimmedBulletIds).toHaveLength(0)
    expect(result.resume.roles.flatMap((role) => role.bullets)).toHaveLength(before)
  })

  it('guards estimateResumePages against non-positive linesPerPage', () => {
    const resume = createResume()
    expect(estimateResumePages(resume, 0)).toBeGreaterThanOrEqual(1)
    expect(estimateResumePages(resume, -5)).toBeGreaterThanOrEqual(1)
  })

  it('never trims must-priority bullets and warns if still over budget', () => {
    const resume = createResume()
    resume.roles = [
      {
        id: 'must-only',
        company: 'Must Co',
        title: 'Engineer',
        dates: 'Now',
        bullets: [
          { id: 'm1', text: 'Must text '.repeat(40), priority: 'must' },
          { id: 'm2', text: 'Must text '.repeat(40), priority: 'must' },
        ],
      },
    ]

    const result = applyPageBudget(resume, {
      targetPages: 1,
      linesPerPage: 5,
      trim: true,
    })

    expect(result.trimmedBulletIds).toHaveLength(0)
    expect(result.resume.roles[0].bullets.map((bullet) => bullet.id)).toEqual(['m1', 'm2'])
    expect(result.warnings.some((warning) => warning.code === 'over_budget_after_trim')).toBe(true)
  })

  it('does not mutate input resume while trimming', () => {
    const resume = createResume()
    const original = JSON.parse(JSON.stringify(resume)) as AssembledResume

    applyPageBudget(resume, {
      targetPages: 1,
      linesPerPage: 8,
      trim: true,
    })

    expect(resume).toEqual(original)
  })
})
