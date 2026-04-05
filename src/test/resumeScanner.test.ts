import { describe, expect, it } from 'vitest'
import {
  detectAmbiguousColumnLayout,
  extractContact,
  extractEducation,
  extractRoles,
  extractSkillGroups,
  groupTextItemsIntoLines,
  parseResumeTextItems,
  splitLinesIntoSections,
  type ResumeTextItem,
} from '../utils/resumeScanner'

const buildLine = (text: string, y: number, x = 72, page = 1): ResumeTextItem[] => [
  {
    text,
    x,
    y,
    width: Math.max(text.length * 5.5, 20),
    height: 12,
    page,
  },
]

const sampleItems: ResumeTextItem[] = [
  ...buildLine('Nick Ferguson', 760),
  ...buildLine('Staff Platform Engineer', 744),
  ...buildLine('nick@example.com | (727) 555-0100 | Tampa, FL | https://github.com/nick', 728),
  ...buildLine('Summary', 696),
  ...buildLine('I build platform systems that make complex delivery work routine.', 680),
  ...buildLine('Experience', 648),
  ...buildLine('Senior Platform Engineer | A10 Networks | Feb 2025 - Mar 2026', 632),
  ...buildLine('• Ported the platform to Kubernetes-based installs.', 616),
  ...buildLine('• Automated release workflows for on-prem deploys.', 600),
  ...buildLine('Skills', 568),
  ...buildLine('Languages: TypeScript, Python', 552),
  ...buildLine('Infra: Kubernetes, Terraform', 536),
  ...buildLine('Education', 504),
  ...buildLine('St. Petersburg College | AAS, Computer Information Systems | Clearwater, FL | 2020', 488),
]

describe('resumeScanner parser', () => {
  it('groups positioned text into ordered lines', () => {
    const items: ResumeTextItem[] = [
      { text: 'Nick', x: 72, y: 760, width: 24, height: 12, page: 1 },
      { text: 'Ferguson', x: 104, y: 760.4, width: 52, height: 12, page: 1 },
      { text: 'Summary', x: 72, y: 700, width: 48, height: 12, page: 1 },
    ]

    const lines = groupTextItemsIntoLines(items)

    expect(lines.map((line) => line.text)).toEqual(['Nick Ferguson', 'Summary'])
  })

  it('detects sections and extracts core resume structure', () => {
    const lines = groupTextItemsIntoLines(sampleItems)
    const sections = splitLinesIntoSections(lines)

    expect(sections.map((section) => section.key)).toEqual([
      'header',
      'summary',
      'experience',
      'skills',
      'education',
    ])

    const contact = extractContact(sections)
    const roles = extractRoles(sections)
    const skillGroups = extractSkillGroups(sections)
    const education = extractEducation(sections)

    expect(contact.name).toBe('Nick Ferguson')
    expect(contact.email).toBe('nick@example.com')
    expect(roles[0]?.company).toBe('A10 Networks')
    expect(roles[0]?.bullets).toEqual([
      'Ported the platform to Kubernetes-based installs.',
      'Automated release workflows for on-prem deploys.',
    ])
    expect(skillGroups.map((group) => group.label)).toEqual(['Languages', 'Infra'])
    expect(education[0]?.school).toBe('St. Petersburg College')
  })

  it('maps a parsed resume into a partial identity shell with source_text bullets', () => {
    const parsed = parseResumeTextItems(sampleItems)

    expect(parsed.identity.identity.name).toBe('Nick Ferguson')
    expect(parsed.identity.roles).toHaveLength(1)
    expect(parsed.identity.roles[0]?.bullets[0]?.source_text).toBe(
      'Ported the platform to Kubernetes-based installs.',
    )
    expect(parsed.identity.roles[0]?.bullets[0]?.problem).toBe('')
    expect(parsed.identity.skills.groups[0]?.items.map((item) => item.name)).toEqual([
      'TypeScript',
      'Python',
    ])
    expect(parsed.identity.education[0]?.year).toBe('2020')
  })

  it('warns when a likely two-column layout is detected', () => {
    const lines = Array.from({ length: 6 }, (_, index) => [
      {
        page: 1,
        y: 760 - index * 20,
        x: 72,
        width: 90,
        text: `Left ${index + 1}`,
        items: [],
      },
      {
        page: 1,
        y: 760 - index * 20,
        x: 330,
        width: 90,
        text: `Right ${index + 1}`,
        items: [],
      },
    ]).flat()
    expect(detectAmbiguousColumnLayout(lines)).toBe(true)
  })

  it('throws a clear error for image-only or unreadable PDFs', () => {
    expect(() => parseResumeTextItems([])).toThrow(/image-only or unreadable/i)
  })
})
