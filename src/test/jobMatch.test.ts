import { describe, expect, it } from 'vitest'
import type { ProfessionalIdentityV3 } from '../identity/schema'
import {
  createJobMatchReport,
  parseJdMatchExtractionResponse,
  prepareMatchJobDescription,
} from '../utils/jobMatch'

const identityFixture: ProfessionalIdentityV3 = {
  version: 3,
  identity: {
    name: 'Nick Ferguson',
    email: 'nick@example.com',
    phone: '555-0100',
    location: 'Tampa, FL',
    links: [],
    thesis: 'I build platform systems that make hard things routine.',
  },
  self_model: {
    arc: [],
    philosophy: [
      {
        id: 'absorb-complexity',
        text: 'I absorb platform complexity so product teams can move faster.',
        tags: ['platform', 'devex'],
      },
    ],
    interview_style: {
      strengths: ['system design'],
      weaknesses: ['whiteboard trivia'],
      prep_strategy: 'Map stories to requirements.',
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
      ideal: ['platform engineering'],
      red_flags: ['maintenance-only'],
      evaluation_criteria: ['ownership'],
    },
  },
  skills: {
    groups: [
      {
        id: 'platform',
        label: 'Platform',
        items: [
          { name: 'Kubernetes', tags: ['platform', 'kubernetes', 'infrastructure'] },
          { name: 'Terraform', tags: ['terraform', 'infrastructure'] },
          { name: 'Linux', tags: ['linux', 'systems'] },
        ],
      },
    ],
  },
  profiles: [
    {
      id: 'platform-profile',
      tags: ['platform', 'pm-communication', 'tradeoffs'],
      text: 'I work with PMs and engineers to make infrastructure tradeoffs legible.',
    },
  ],
  roles: [
    {
      id: 'a10',
      company: 'A10 Networks',
      title: 'Senior Platform Engineer',
      dates: '2025-2026',
      bullets: [
        {
          id: 'platform-migration',
          problem: 'Cloud-only delivery blocked on-prem deployments.',
          action: 'Ported the platform to Kubernetes-based on-prem installs with Terraform-backed infrastructure.',
          outcome: 'Made the product deployable in customer environments.',
          impact: ['Unlocked on-prem delivery'],
          metrics: { services_ported: 12 },
          technologies: ['Kubernetes', 'Terraform'],
          tags: ['platform', 'kubernetes', 'migration', 'infrastructure'],
        },
        {
          id: 'kernel-debug',
          problem: 'Edge deployments were failing under Linux networking constraints.',
          action: 'Debugged low-level Linux behavior and packet handling issues in production-like environments.',
          outcome: 'Stabilized the sensor runtime.',
          impact: ['Resolved Linux edge instability'],
          metrics: { incidents_resolved: 4 },
          technologies: ['Linux'],
          tags: ['linux', 'debugging', 'systems'],
        },
      ],
    },
  ],
  projects: [
    {
      id: 'obs',
      name: 'Observability Console',
      description: 'Built Grafana-based visibility for platform teams.',
      tags: ['observability', 'platform', 'grafana'],
    },
  ],
  education: [],
  generator_rules: {
    voice_skill: 'nick-voice',
    resume_skill: 'nick-resume',
  },
}

describe('jobMatch', () => {
  it('parses structured JD match output from fenced JSON', () => {
    const parsed = parseJdMatchExtractionResponse(`\`\`\`json
{
  "summary": "Strong platform fit with explicit Linux debugging requirements.",
  "company": "Atlas",
  "role": "Staff Platform Engineer",
  "requirements": [
    {
      "id": "platform-delivery",
      "label": "Platform delivery",
      "priority": "core",
      "evidence": "The JD needs someone to own deployment platforms.",
      "tags": ["platform", "kubernetes", "infrastructure"],
      "keywords": ["Kubernetes", "Terraform"]
    }
  ],
  "advantage_hypotheses": [
    {
      "id": "platform-and-systems",
      "claim": "The candidate can bridge platform architecture and low-level operations.",
      "requirement_ids": ["platform-delivery"]
    }
  ],
  "positioning_recommendations": ["Lead with platform migration stories."],
  "gap_focus": ["Call out on-call ownership explicitly."],
  "warnings": []
}
\`\`\``)

    expect(parsed.company).toBe('Atlas')
    expect(parsed.requirements[0]?.tags).toEqual(['platform', 'kubernetes', 'infrastructure'])
    expect(parsed.advantageHypotheses[0]?.requirementIds).toEqual(['platform-delivery'])
  })

  it('parses structured JD match output from raw JSON', () => {
    const parsed = parseJdMatchExtractionResponse(
      JSON.stringify({
        summary: 'Platform-heavy role.',
        company: 'Atlas',
        role: 'Platform Engineer',
        requirements: [
          {
            id: 'platform-delivery',
            label: 'Platform delivery',
            priority: 'core',
            evidence: 'Own the internal platform.',
            tags: ['platform'],
            keywords: ['platform'],
          },
        ],
        advantage_hypotheses: [],
        positioning_recommendations: [],
        gap_focus: [],
        warnings: [],
      }),
    )

    expect(parsed.summary).toBe('Platform-heavy role.')
    expect(parsed.requirements).toHaveLength(1)
  })

  it('scores identity assets and surfaces gaps and advantages', () => {
    const report = createJobMatchReport({
      identity: identityFixture,
      prepared: prepareMatchJobDescription('Need a platform engineer with Kubernetes, Terraform, Linux debugging, and AI experience.'),
      extraction: {
        summary: 'Platform-heavy role with systems work and one AI gap.',
        company: 'Atlas',
        role: 'Staff Platform Engineer',
        requirements: [
          {
            id: 'platform-delivery',
            label: 'Platform delivery',
            priority: 'core',
            evidence: 'Own Kubernetes and Terraform-backed delivery systems.',
            tags: ['platform', 'kubernetes', 'infrastructure'],
            keywords: ['Kubernetes', 'Terraform'],
          },
          {
            id: 'linux-debugging',
            label: 'Linux debugging',
            priority: 'important',
            evidence: 'Debug Linux and kernel-adjacent production issues.',
            tags: ['linux', 'debugging', 'systems'],
            keywords: ['Linux', 'kernel'],
          },
          {
            id: 'ai-systems',
            label: 'AI systems',
            priority: 'supporting',
            evidence: 'Some AI platform exposure is preferred.',
            tags: ['ai', 'machine-learning'],
            keywords: ['AI'],
          },
        ],
        advantageHypotheses: [
          {
            id: 'platform-systems-bridge',
            claim: 'You have evidence for both platform delivery and Linux debugging, which is a strong combination for this role.',
            requirementIds: ['platform-delivery', 'linux-debugging'],
          },
        ],
        positioningRecommendations: ['Lead with the on-prem platform migration and the Linux stabilization story.'],
        gapFocus: ['Do not over-claim AI depth.'],
        warnings: [],
      },
    })

    expect(report.company).toBe('Atlas')
    expect(report.matchScore).toBeGreaterThan(0.5)
    expect(report.topBullets[0]?.id).toBe('platform-migration')
    expect(report.topSkills.some((asset) => asset.label === 'Kubernetes')).toBe(true)
    expect(report.gaps.some((gap) => gap.requirementId === 'ai-systems')).toBe(true)
    expect(report.advantages[0]?.evidence.length).toBeGreaterThan(0)
    expect(report.requirements.find((entry) => entry.id === 'platform-delivery')?.coverageScore).toBeGreaterThan(0.6)
  })
})
