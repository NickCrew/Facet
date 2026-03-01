import { describe, expect, it } from 'vitest'
import { assembleResume, buildComponentKeys, getPriorityForVector } from '../engine/assembler'
import { defaultResumeData } from '../store/defaultData'

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe('assembleResume', () => {
  it('includes must backend components for backend vector', () => {
    const data = clone(defaultResumeData)
    const result = assembleResume(data, { selectedVector: 'backend' })

    expect(result.resume.targetLine?.id).toBe('tl-backend')
    expect(result.resume.profile?.id).toBe('profile-backend')
    expect(result.resume.roles[0]?.bullets.length).toBeGreaterThan(0)
    expect(result.resume.roles[0]?.bullets.every((bullet) => bullet.text.length > 0)).toBe(true)
  })

  it('applies manual overrides for excluded components', () => {
    const data = clone(defaultResumeData)
    const result = assembleResume(data, {
      selectedVector: 'leadership',
      manualOverrides: {
        'target_line:tl-leadership': false,
        'target_line:tl-backend': true,
      },
    })

    expect(result.resume.targetLine?.id).toBe('tl-backend')
  })

  it('trims optional/strong bullets when page budget is exceeded', () => {
    const data = clone(defaultResumeData)

    data.roles[0].bullets = [
      ...data.roles[0].bullets,
      ...Array.from({ length: 40 }).map((_, index) => ({
        id: `extra-opt-${index}`,
        vectors: { backend: 'optional' as const },
        text: `Optional filler bullet ${index} `.repeat(10),
      })),
    ]

    const result = assembleResume(data, {
      selectedVector: 'backend',
      targetPages: 1,
    })

    expect(result.estimatedPages).toBeLessThanOrEqual(1)
    expect(result.trimmedBulletIds.length).toBeGreaterThan(0)
  })

  it('supports explicit variant overrides', () => {
    const data = clone(defaultResumeData)

    const forcedVariant = assembleResume(data, {
      selectedVector: 'backend',
      variantOverrides: {
        'role:acme:bullet:acme-b1': 'platform',
      },
    })

    const forcedBullet = forcedVariant.resume.roles
      .flatMap((role) => role.bullets)
      .find((bullet) => bullet.id === 'acme-b1')

    expect(forcedBullet?.text).toContain('self-service order processing platform')

    const forcedDefault = assembleResume(data, {
      selectedVector: 'platform',
      variantOverrides: {
        'role:acme:bullet:acme-b1': 'default',
      },
    })

    const defaultBullet = forcedDefault.resume.roles
      .flatMap((role) => role.bullets)
      .find((bullet) => bullet.id === 'acme-b1')

    expect(defaultBullet?.text).toContain('Designed and built a high-throughput order processing pipeline')
  })

  it('resolves all-vector selection using highest priority', () => {
    const data = clone(defaultResumeData)
    data.projects = [
      {
        id: 'all-mode-project',
        name: 'All Mode',
        vectors: {
          backend: 'optional',
          leadership: 'must',
        },
        text: 'Should remain in all mode',
      },
    ]

    const result = assembleResume(data, { selectedVector: 'all' })
    expect(result.resume.projects[0]?.priority).toBe('must')
  })

  it('excludes roles with no qualifying bullets', () => {
    const data = clone(defaultResumeData)
    data.roles = [
      {
        ...data.roles[0],
        id: 'only-excluded',
        bullets: [
          {
            id: 'excluded-bullet',
            vectors: { backend: 'exclude' },
            text: 'Should be removed',
          },
        ],
      },
    ]

    const result = assembleResume(data, { selectedVector: 'backend' })
    expect(result.resume.roles).toHaveLength(0)
  })

  it('supports role-level manual exclusion', () => {
    const data = clone(defaultResumeData)
    const targetRole = data.roles[0].id
    const result = assembleResume(data, {
      selectedVector: 'backend',
      manualOverrides: {
        [`role:${targetRole}`]: false,
      },
    })

    expect(result.resume.roles.find((role) => role.id === targetRole)).toBeUndefined()
  })

  it('applies per-role bullet ordering map', () => {
    const data = clone(defaultResumeData)
    const role = data.roles[0]
    const includedIds = role.bullets
      .filter((bullet) => bullet.vectors.backend && bullet.vectors.backend !== 'exclude')
      .map((bullet) => bullet.id)
    const reversed = [...includedIds].reverse()

    const result = assembleResume(data, {
      selectedVector: 'backend',
      bulletOrderByRole: {
        [role.id]: reversed,
      },
    })

    const outputBullets = result.resume.roles.find((item) => item.id === role.id)?.bullets ?? []
    expect(outputBullets[0]?.id).toBe(reversed[0])
  })

  it('routes skill groups by vector priority, order, and content override', () => {
    const data = clone(defaultResumeData)
    data.skill_groups = [
      {
        id: 'languages',
        label: 'Languages',
        content: 'Go, Python',
        vectors: {
          backend: { priority: 'strong', order: 2 },
          platform: { priority: 'strong', order: 1, content: 'TypeScript, Go, Python' },
        },
      },
      {
        id: 'tooling',
        label: 'Tooling',
        content: 'Terraform, Docker',
        vectors: {
          backend: { priority: 'must', order: 1 },
          platform: { priority: 'exclude', order: 2 },
        },
      },
    ]

    const backend = assembleResume(data, { selectedVector: 'backend' })
    expect(backend.resume.skillGroups.map((group) => group.id)).toEqual(['tooling', 'languages'])

    const platform = assembleResume(data, { selectedVector: 'platform' })
    expect(platform.resume.skillGroups.map((group) => group.id)).toEqual(['languages'])
    expect(platform.resume.skillGroups[0]?.content).toContain('TypeScript')
  })

  it('exposes stable component key order for overrides', () => {
    expect(buildComponentKeys('bullet', 'b1', 'r1')).toEqual([
      'role:r1:bullet:b1',
      'role:r1:b1',
      'bullet:b1',
      'b1',
    ])
  })

  it('returns exclude priority when vector does not match', () => {
    expect(getPriorityForVector({ backend: 'must' }, 'leadership')).toBe('exclude')
  })

  it('selects highest-priority target line when multiple match', () => {
    const data = clone(defaultResumeData)
    data.target_lines = [
      { id: 'tl-optional', text: 'Optional line', vectors: { backend: 'optional' } },
      { id: 'tl-must', text: 'Must line', vectors: { backend: 'must' } },
      { id: 'tl-strong', text: 'Strong line', vectors: { backend: 'strong' } },
    ]

    const result = assembleResume(data, { selectedVector: 'backend' })
    expect(result.resume.targetLine?.id).toBe('tl-must')
  })

  it('force-includes excluded bullets as optional priority', () => {
    const data = clone(defaultResumeData)
    data.roles = [
      {
        ...data.roles[0],
        id: 'force-include-role',
        bullets: [
          {
            id: 'excluded-by-default',
            vectors: { backend: 'exclude' },
            text: 'Force include me',
          },
        ],
      },
    ]

    const result = assembleResume(data, {
      selectedVector: 'backend',
      manualOverrides: {
        'role:force-include-role:bullet:excluded-by-default': true,
      },
    })

    const bullet = result.resume.roles[0]?.bullets[0]
    expect(bullet?.id).toBe('excluded-by-default')
    expect(bullet?.priority).toBe('optional')
  })

  it('auto-selects vector variant when override is not set', () => {
    const data = clone(defaultResumeData)
    const result = assembleResume(data, { selectedVector: 'platform' })

    const bullet = result.resume.roles
      .flatMap((role) => role.bullets)
      .find((item) => item.id === 'acme-b1')

    expect(bullet?.text).toContain('self-service order processing platform')
  })
})
