import { describe, expect, it } from 'vitest'
import { defaultResumeData } from '../store/defaultData'
import { importResumeConfig } from '../engine/serializer'
import {
  importProfessionalIdentity,
  looksLikeProfessionalIdentity,
  type ProfessionalIdentityV3,
} from '../identity/schema'

const baseIdentityFixture: ProfessionalIdentityV3 = {
  $schema: 'https://atlascrew.dev/schemas/identity.json',
  version: 3,
  identity: {
    name: 'Nicholas Ferguson',
    display_name: 'Nicholas Crew Ferguson',
    email: 'nick@atlascrew.dev',
    phone: '727.266.8813',
    location: 'Tampa Bay Area, FL',
    remote: true,
    title: 'Product Engineer',
    links: [
      { id: 'github', url: 'https://github.com/NickCrew' },
      { id: 'portfolio', url: 'https://portfolio.atlascrew.dev' },
    ],
    thesis: 'I solve business problems with computers.',
    elaboration: 'Bridge prototype-to-production gaps.',
    origin: 'Background in hospitality and photography.',
  },
  self_model: {
    arc: [
      { company: 'vispero', chapter: 'I can build anything' },
      { company: 'a10', chapter: 'I know why to build it' },
    ],
    philosophy: [
      {
        id: 'handoff-first',
        text: 'Everything is built to hand off from day one.',
        tags: ['Leadership', ' leadership '],
      },
      {
        id: 'problem-solving',
        text: 'I solve problems nobody knew to ask about.',
        tags: ['product'],
      },
    ],
    interview_style: {
      strengths: ['System design'],
      weaknesses: ['Timed coding challenges'],
      prep_strategy: 'Lead with stories.',
    },
  },
  preferences: {
    compensation: {
      base_floor: 180000,
      base_target: 200000,
      priorities: [
        { item: 'Base salary', weight: 'critical' },
        { item: 'Health insurance', weight: 'high' },
      ],
    },
    work_model: {
      preference: 'remote',
      hard_no: 'On-site required without relocation assistance',
    },
    role_fit: {
      ideal: ['Platform roles'],
      red_flags: ['Pure ticket queue work'],
      evaluation_criteria: ['Can I build something here?'],
    },
  },
  skills: {
    groups: [
      {
        id: 'sg-languages',
        label: 'Languages',
        items: [
          { name: 'TypeScript', proficiency: 'primary', tags: ['Platform', 'platform', ' DevEx '] },
          { name: 'Python', proficiency: 'primary', tags: ['backend', 'data'] },
        ],
      },
      {
        id: 'sg-practices',
        label: 'Also',
        items: [
          { name: 'Technical writing', tags: ['documentation', 'platform'] },
        ],
      },
    ],
  },
  profiles: [
    {
      id: 'profile-default',
      tags: ['General', 'platform', 'platform'],
      text: 'I drop into unfamiliar environments and ship.',
    },
  ],
  roles: [
    {
      id: 'a10',
      company: 'A10 Networks',
      subtitle: '(acquired ThreatX)',
      title: 'Senior Platform Engineer',
      dates: 'Feb 2025 – Mar 2026',
      portfolio_anchor: '#background',
      bullets: [
        {
          id: 'a10-delivery',
          problem: 'Legacy cloud-only architecture limited deployment options.',
          action: 'Rebuilt the product as a standalone edge sensor.',
          outcome: 'Product deployable anywhere.',
          impact: ['Unlocked deployment flexibility', 'Opened new market segment'],
          metrics: { latency_improvement: '4400x', services_replaced: 12 },
          technologies: ['Rust', 'Pingora'],
          portfolio_dive: '#synapse',
          tags: ['Security', 'security', ' Product '],
        },
      ],
    },
  ],
  projects: [
    {
      id: 'proj-facet',
      name: 'Facet',
      url: 'https://atlascrew.dev/facet',
      description: 'Targeted resume generation and job search workflow.',
      portfolio_dive: '#opensource',
      tags: ['product', 'typescript'],
    },
  ],
  education: [
    {
      school: 'St. Petersburg College',
      location: 'Clearwater, FL',
      degree: 'AAS, Computer Information Systems',
    },
  ],
  generator_rules: {
    voice_skill: 'nick-voice',
    resume_skill: 'nick-resume',
    accuracy: {
      platform_count: 'Four platforms across three companies',
      endpoint_platforms: ['Windows', 'Linux', 'macOS'],
    },
  },
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe('professional identity schema', () => {
  it('normalizes and deduplicates tags during identity import', () => {
    const parsed = importProfessionalIdentity(clone(baseIdentityFixture))

    expect(parsed.data.self_model.philosophy[0]?.tags).toEqual(['leadership'])
    expect(parsed.data.skills.groups[0]?.items[0]?.tags).toEqual(['platform', 'devex'])
    expect(parsed.data.profiles[0]?.tags).toEqual(['general', 'platform'])
    expect(parsed.data.roles[0]?.bullets[0]?.tags).toEqual(['security', 'product'])
    expect(parsed.warnings.some((warning) => warning.includes('duplicate tag "platform"'))).toBe(true)
  })

  it('bridges identity.json into the current resume data model', () => {
    const parsed = importResumeConfig(JSON.stringify(baseIdentityFixture), 'json')

    expect(parsed.sourceKind).toBe('professional-identity-v3')
    expect(parsed.data.meta.name).toBe('Nicholas Crew Ferguson')
    expect(parsed.data.vectors).toEqual([
      {
        id: 'identity-default',
        label: 'Identity Default',
        color: '#2563EB',
      },
    ])
    expect(parsed.data.target_lines[0]?.text).toBe('Product Engineer')
    expect(parsed.data.roles[0]?.bullets[0]?.label).toBe('Unlocked deployment flexibility')
    expect(parsed.data.roles[0]?.bullets[0]?.text).toBe(
      'Legacy cloud-only architecture limited deployment options. Rebuilt the product as a standalone edge sensor. Product deployable anywhere.',
    )
    expect(parsed.data.skill_groups[0]?.content).toBe('TypeScript, Python')
    expect(parsed.warnings.some((warning) => warning.includes('Schema v3'))).toBe(true)
  })

  it('rejects unsupported schema versions', () => {
    const invalid = clone(baseIdentityFixture)
    invalid.version = 2 as 3

    expect(() => importProfessionalIdentity(invalid)).toThrow(/version must be 3/i)
  })

  it('rejects missing required identity fields', () => {
    const invalid = clone(baseIdentityFixture)
    delete (invalid.identity as unknown as Record<string, unknown>).name

    expect(() => importProfessionalIdentity(invalid)).toThrow(/identity.name/)
  })

  it('rejects duplicate role ids', () => {
    const invalid = clone(baseIdentityFixture)
    invalid.roles.push(clone(baseIdentityFixture.roles[0]))

    expect(() => importProfessionalIdentity(invalid)).toThrow(/duplicate id/i)
  })

  it('rejects duplicate bullet ids across different roles', () => {
    const invalid = clone(baseIdentityFixture)
    invalid.roles.push({
      id: 'threatx',
      company: 'ThreatX',
      subtitle: '(acquired by A10 Networks)',
      title: 'Senior Platform Engineer',
      dates: 'Jan 2022 – Feb 2025',
      portfolio_anchor: '#background',
      bullets: [
        {
          id: 'a10-delivery',
          problem: 'Repeated id in another role.',
          action: 'This should fail validation.',
          outcome: 'Parser should reject duplicate ids.',
          impact: ['Reject duplicate ids'],
          metrics: {},
          technologies: ['TypeScript'],
          portfolio_dive: '#duplicate',
          tags: ['platform'],
        },
      ],
    })

    expect(() => importProfessionalIdentity(invalid)).toThrow(/duplicate id/i)
  })

  it('does not confuse resume configs for professional identity files', () => {
    expect(looksLikeProfessionalIdentity(defaultResumeData)).toBe(false)
  })

  it('handles identity files with optional fields omitted', () => {
    const minimal = clone(baseIdentityFixture)
    delete (minimal.identity as unknown as Record<string, unknown>).display_name
    delete (minimal.identity as unknown as Record<string, unknown>).title
    delete (minimal.identity as unknown as Record<string, unknown>).elaboration
    delete (minimal.identity as unknown as Record<string, unknown>).origin
    delete (minimal.skills.groups[0]?.items[0] as unknown as Record<string, unknown>).proficiency
    delete (minimal.roles[0] as unknown as Record<string, unknown>).subtitle
    delete (minimal.roles[0] as unknown as Record<string, unknown>).portfolio_anchor
    delete (minimal.roles[0]?.bullets[0] as unknown as Record<string, unknown>).portfolio_dive
    delete (minimal.projects[0] as unknown as Record<string, unknown>).url
    delete (minimal.projects[0] as unknown as Record<string, unknown>).portfolio_dive
    delete (minimal.education[0] as unknown as Record<string, unknown>).year

    const parsed = importResumeConfig(JSON.stringify(minimal), 'json')

    expect(parsed.sourceKind).toBe('professional-identity-v3')
    expect(parsed.data.meta.name).toBe('Nicholas Ferguson')
    expect(parsed.data.target_lines[0]?.text).toBe('I solve business problems with computers.')
    expect(parsed.data.projects[0]?.url).toBeUndefined()
    expect(parsed.data.education[0]?.id).toBe('edu-st-petersburg-college-aas-computer-information-systems-clearwater-fl')
  })

  it('supports sparse sections and stable deduplicated education ids', () => {
    const sparse = clone(baseIdentityFixture)
    sparse.profiles = []
    sparse.roles = []
    sparse.projects = []
    sparse.education = [
      clone(baseIdentityFixture.education[0]),
      clone(baseIdentityFixture.education[0]),
    ]

    const parsed = importResumeConfig(JSON.stringify(sparse), 'json')

    expect(parsed.sourceKind).toBe('professional-identity-v3')
    expect(parsed.data.profiles).toEqual([])
    expect(parsed.data.roles).toEqual([])
    expect(parsed.data.projects).toEqual([])
    expect(parsed.data.education.map((entry) => entry.id)).toEqual([
      'edu-st-petersburg-college-aas-computer-information-systems-clearwater-fl',
      'edu-st-petersburg-college-aas-computer-information-systems-clearwater-fl--2',
    ])
  })

  it('rejects prototype pollution keys in identity input', () => {
    const polluted = clone(baseIdentityFixture) as unknown as Record<string, unknown>
    Object.defineProperty(polluted, '__proto__', {
      value: { polluted: true },
      enumerable: true,
      configurable: true,
    })

    expect(() => importProfessionalIdentity(polluted)).toThrow(/unsupported key/i)
  })

  it('trims empty bullet fragments when adapting bullet text', () => {
    const sparseBullet = clone(baseIdentityFixture)
    sparseBullet.roles[0].bullets[0].problem = '   '

    const parsed = importResumeConfig(JSON.stringify(sparseBullet), 'json')

    expect(parsed.sourceKind).toBe('professional-identity-v3')
    expect(parsed.data.roles[0]?.bullets[0]?.text).toBe(
      'Rebuilt the product as a standalone edge sensor. Product deployable anywhere.',
    )
  })
})
