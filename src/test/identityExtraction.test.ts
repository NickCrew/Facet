import { describe, expect, it } from 'vitest'
import { parseIdentityExtractionResponse } from '../utils/identityExtraction'

const responseBody = {
  summary: 'Strong platform draft with one open metric question.',
  follow_up_questions: ['What was the scope of the migration?'],
  identity: {
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
          {
            id: 'acme-2',
            problem: 'Teams had inconsistent release mechanics.',
            action: 'Standardized release workflows for product teams.',
            outcome: 'Reduced deployment pain across the org.',
            impact: ['Reduced friction'],
            metrics: {},
            technologies: ['GitHub Actions'],
            tags: ['platform', 'enablement'],
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
  },
}

describe('identityExtraction', () => {
  it('parses extraction output and backfills bullets that were not annotated', () => {
    const parsed = parseIdentityExtractionResponse(
      JSON.stringify({
        ...responseBody,
        bullets: [
          {
            role_id: 'acme',
            bullet_id: 'acme-1',
            rewrite: 'Led platform migration [scope: guessing] to a unified deployment workflow with org-wide adoption.',
            tags: ['platform', 'delivery', 'platform'],
            assumptions: [{ label: 'scope', confidence: 'guessing' }],
          },
          {
            role_id: 'missing',
            bullet_id: 'ghost',
            rewrite: 'Ignore me',
            tags: ['ghost'],
            assumptions: [],
          },
        ],
      }),
    )

    expect(parsed.summary).toContain('Strong platform draft')
    expect(parsed.followUpQuestions).toEqual(['What was the scope of the migration?'])
    expect(parsed.bullets).toHaveLength(2)
    expect(parsed.bullets[0]?.assumptions).toEqual([{ label: 'scope', confidence: 'guessing' }])
    expect(parsed.bullets[0]?.tags).toEqual(['platform', 'delivery'])
    expect(parsed.bullets[1]?.bulletId).toBe('acme-2')
    expect(parsed.bullets[1]?.rewrite).toBe(
      'Teams had inconsistent release mechanics. Standardized release workflows for product teams. Reduced deployment pain across the org.',
    )
    expect(parsed.bullets[1]?.assumptions).toEqual([])
    expect(parsed.warnings.some((warning) => warning.includes('unknown bullet'))).toBe(true)
  })

  it('rejects invalid confidence labels', () => {
    expect(() =>
      parseIdentityExtractionResponse(
        JSON.stringify({
          ...responseBody,
          bullets: [
            {
              role_id: 'acme',
              bullet_id: 'acme-1',
              rewrite: 'Invalid confidence label',
              tags: ['platform'],
              assumptions: [{ label: 'scope', confidence: 'maybe' }],
            },
          ],
        }),
      ),
    ).toThrow(/must be one of stated, confirmed, guessing, corrected/)
  })

  it('repairs minor JSON syntax issues before validation', () => {
    const malformed = `{
      "summary": "Strong platform draft with one open metric question.",
      "follow_up_questions": [
        "What was the scope of the migration?"
        "How many pipelines were involved?"
      ],
      "identity": ${JSON.stringify(responseBody.identity, null, 2)},
      "bullets": []
    }`

    const parsed = parseIdentityExtractionResponse(malformed)

    expect(parsed.followUpQuestions).toEqual([
      'What was the scope of the migration?',
      'How many pipelines were involved?',
    ])
    expect(parsed.warnings).toContain(
      'Repaired minor JSON syntax issues in the AI response before validation.',
    )
  })

  it('normalizes generator_rules when the AI returns a string', () => {
    const parsed = parseIdentityExtractionResponse(
      JSON.stringify({
        ...responseBody,
        identity: {
          ...responseBody.identity,
          generator_rules: 'nick-default',
        },
      }),
    )

    expect(parsed.identity.generator_rules).toEqual({
      voice_skill: 'nick-default',
      resume_skill: 'nick-default',
    })
    expect(parsed.warnings).toContain(
      'Normalized generator_rules from a string into { voice_skill, resume_skill } for AI extraction output.',
    )
  })

  it('adds default generator_rules when the AI omits them', () => {
    const identityWithoutGeneratorRules = structuredClone(responseBody.identity) as Record<string, unknown>
    delete identityWithoutGeneratorRules.generator_rules

    const parsed = parseIdentityExtractionResponse(
      JSON.stringify({
        ...responseBody,
        identity: identityWithoutGeneratorRules,
      }),
    )

    expect(parsed.identity.generator_rules).toEqual({
      voice_skill: '',
      resume_skill: '',
    })
    expect(parsed.warnings).toContain(
      'Added missing generator_rules object with empty defaults for AI extraction output.',
    )
  })

  it('normalizes bullet technologies when the AI returns a string', () => {
    const malformedIdentity = structuredClone(responseBody.identity) as Record<string, unknown>
    const roles = malformedIdentity.roles as Array<Record<string, unknown>>
    const bullets = roles[0]?.bullets as Array<Record<string, unknown>>
    bullets[1] = {
      ...bullets[1],
      technologies: 'GitHub Actions, Terraform',
    }

    const parsed = parseIdentityExtractionResponse(
      JSON.stringify({
        ...responseBody,
        identity: malformedIdentity,
      }),
    )

    expect(parsed.identity.roles[0]?.bullets[1]?.technologies).toEqual([
      'GitHub Actions',
      'Terraform',
    ])
    expect(parsed.warnings).toContain(
      'Normalized roles[0].bullets[1].technologies from a string into a string array for AI extraction output.',
    )
  })

  it('normalizes projects when the AI returns a single object', () => {
    const malformedIdentity = structuredClone(responseBody.identity) as Record<string, unknown>
    const firstProject = (malformedIdentity.projects as Array<Record<string, unknown>>)[0]
    malformedIdentity.projects = firstProject

    const parsed = parseIdentityExtractionResponse(
      JSON.stringify({
        ...responseBody,
        identity: malformedIdentity,
      }),
    )

    expect(parsed.identity.projects).toHaveLength(1)
    expect(parsed.identity.projects[0]).toEqual({
      id: 'facet',
      name: 'Facet',
      description: 'Resume and identity tooling.',
      tags: ['career-tools'],
    })
    expect(parsed.warnings).toContain(
      'Normalized projects from an object into a single-item array for AI extraction output.',
    )
  })

  it('normalizes education when the AI returns a single object', () => {
    const malformedIdentity = structuredClone(responseBody.identity) as Record<string, unknown>
    const firstEducation = (malformedIdentity.education as Array<Record<string, unknown>>)[0]
    malformedIdentity.education = firstEducation

    const parsed = parseIdentityExtractionResponse(
      JSON.stringify({
        ...responseBody,
        identity: malformedIdentity,
      }),
    )

    expect(parsed.identity.education).toHaveLength(1)
    expect(parsed.identity.education[0]).toEqual({
      school: 'State College',
      location: 'Florida',
      degree: 'B.S. Computer Science',
      year: '2018',
    })
    expect(parsed.warnings).toContain(
      'Normalized education from an object into a single-item array for AI extraction output.',
    )
  })
})
