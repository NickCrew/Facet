import { describe, expect, it } from 'vitest'
import type { ProfessionalIdentityV3 } from '../identity/schema'
import { mergeProfessionalIdentity, replaceProfessionalIdentity } from '../utils/identityMerge'

const createIdentity = (): ProfessionalIdentityV3 => ({
  $schema: 'https://atlascrew.dev/schemas/identity.json',
  version: 3,
  identity: {
    name: 'Jordan Example',
    email: 'jordan@example.com',
    phone: '555-0100',
    location: 'Remote',
    links: [{ id: 'linkedin', url: 'https://example.com/in/jordan' }],
    thesis: 'Platform-minded staff engineer.',
  },
  self_model: {
    arc: [{ company: 'Acme', chapter: 'Scaled platform delivery' }],
    philosophy: [
      { id: 'boring-systems', text: 'Prefer boring systems that fail well.', tags: ['platform'] },
    ],
    interview_style: {
      strengths: ['System design'],
      weaknesses: ['Over-explaining'],
      prep_strategy: 'Map stories to company context.',
    },
  },
  preferences: {
    compensation: {
      priorities: [{ item: 'base', weight: 'high' }],
    },
    work_model: {
      preference: 'remote',
    },
    role_fit: {
      ideal: ['platform'],
      red_flags: ['bait-and-switch'],
      evaluation_criteria: ['scope'],
    },
  },
  skills: {
    groups: [
      {
        id: 'languages',
        label: 'Languages',
        items: [{ name: 'TypeScript', tags: ['platform'] }],
      },
    ],
  },
  profiles: [
    {
      id: 'default',
      tags: ['platform'],
      text: 'Platform engineer who ships maintainable systems.',
    },
  ],
  roles: [
    {
      id: 'acme',
      company: 'Acme',
      title: 'Senior Engineer',
      dates: '2022 - Present',
      bullets: [
        {
          id: 'acme-1',
          problem: 'Deployment workflow was fragmented.',
          action: 'Led platform migration to a unified pipeline.',
          outcome: 'Teams shipped through one deployment workflow.',
          impact: ['Standardized delivery'],
          metrics: { pipelines: 12 },
          technologies: ['TypeScript', 'Terraform'],
          tags: ['platform', 'delivery'],
        },
      ],
    },
  ],
  projects: [
    {
      id: 'facet',
      name: 'Facet',
      description: 'Resume and identity tooling.',
      tags: ['career-tools'],
    },
  ],
  education: [
    {
      school: 'State College',
      location: 'Florida',
      degree: 'B.S. Computer Science',
      year: '2018',
    },
  ],
  generator_rules: {
    voice_skill: 'nick-voice',
    resume_skill: 'nick-resume',
  },
})

describe('identityMerge', () => {
  it('merges by id and preserves existing entries that are not replaced', () => {
    const current = createIdentity()
    const incoming = createIdentity()
    incoming.identity.title = 'Staff Engineer'
    incoming.self_model.philosophy = [
      ...incoming.self_model.philosophy,
      { id: 'handoff-first', text: 'Everything is built to hand off from day one.', tags: ['leadership'] },
    ]
    incoming.skills.groups = [
      {
        id: 'languages',
        label: 'Languages',
        items: [
          { name: 'TypeScript', tags: ['platform'] },
          { name: 'Go', tags: ['infrastructure'] },
        ],
      },
      {
        id: 'infra',
        label: 'Infrastructure',
        items: [{ name: 'Kubernetes', tags: ['platform'] }],
      },
    ]
    incoming.profiles = [
      {
        id: 'default',
        tags: ['platform', 'leadership'],
        text: 'Staff platform engineer for scale-sensitive systems.',
      },
      {
        id: 'founding',
        tags: ['startup'],
        text: 'Builds systems quickly with small teams.',
      },
    ]
    incoming.roles = [
      incoming.roles[0],
      {
        id: 'beta',
        company: 'Beta',
        title: 'Principal Engineer',
        dates: '2020 - 2022',
        bullets: [
          {
            id: 'beta-1',
            problem: 'Platform work was fragmented.',
            action: 'Built internal platform.',
            outcome: 'Established paved-road tooling for product teams.',
            impact: ['Created paved road'],
            metrics: {},
            technologies: ['Go'],
            tags: ['platform', 'enablement'],
          },
        ],
      },
    ]
    incoming.projects = [
      incoming.projects[0],
      {
        id: 'cortex',
        name: 'Cortex',
        description: 'Agent workflow tooling.',
        tags: ['agents'],
      },
    ]

    const result = mergeProfessionalIdentity(current, incoming)

    expect(result.data.identity.title).toBe('Staff Engineer')
    expect(result.data.skills.groups).toHaveLength(2)
    expect(result.data.profiles).toHaveLength(2)
    expect(result.data.roles).toHaveLength(2)
    expect(result.data.projects).toHaveLength(2)
    expect(result.details).toEqual(
      expect.arrayContaining([
        'Replaced identity core from draft.',
        'Replaced self model from draft.',
        'Added skill groups: infra.',
        'Updated skill groups: languages.',
        'Added profiles: founding.',
        'Updated profiles: default.',
        'Added roles: beta.',
        'Added projects: cortex.',
      ]),
    )
  })

  it('deduplicates identical education entries and can replace wholesale', () => {
    const current = createIdentity()
    const incoming = createIdentity()
    incoming.education = [
      {
        school: 'State College',
        location: 'Florida',
        degree: 'B.S. Computer Science',
        year: '2018',
      },
    ]

    const merged = mergeProfessionalIdentity(current, incoming)
    expect(merged.data.education).toHaveLength(1)

    const replaced = replaceProfessionalIdentity(incoming)
    expect(replaced.summary).toContain('Replaced identity model')
    expect(replaced.data.roles).toHaveLength(1)
  })
})

