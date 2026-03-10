import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ResumeMeta, ResumeTheme } from '../types'
import type { CoverLetterTemplate } from '../types/coverLetter'

interface MockSnippetInstance {
  lastPdfArgs: { mainContent?: string; inputs?: Record<string, string> } | null
}

const snippetInstances: MockSnippetInstance[] = []

vi.mock('@myriaddreamin/typst-ts-web-compiler/wasm?url', () => ({
  default: '/assets/typst-ts-web-compiler.wasm',
}))

vi.mock('@myriaddreamin/typst-ts-renderer/wasm?url', () => ({
  default: '/assets/typst-ts-renderer.wasm',
}))

vi.mock('@myriaddreamin/typst.ts/contrib/snippet', () => {
  class MockTypstSnippet {
    private instance: MockSnippetInstance

    static disableDefaultFontAssets() {
      return { key: 'disable-default-font-assets' }
    }

    static preloadFonts() {
      return { key: 'preload-fonts' }
    }

    constructor() {
      this.instance = { lastPdfArgs: null }
      snippetInstances.push(this.instance)
    }

    setCompilerInitOptions() {}
    setRendererInitOptions() {}
    use() {}

    async pdf(args: { mainContent?: string; inputs?: Record<string, string> }) {
      this.instance.lastPdfArgs = args
      return new TextEncoder().encode('%PDF-1.7\n/Type /Page\n')
    }
  }

  return { TypstSnippet: MockTypstSnippet }
})

const loadRenderer = () => import('../utils/letterPdfRenderer')

const createTheme = (): ResumeTheme => ({
  id: 'ferguson-v12',
  name: 'Ferguson v1.2',
  templateId: 'letter',
  fontBody: 'Unknown Font',
  fontHeading: 'Unknown Font',
  sizeBody: 9,
  sizeName: 14,
  sizeSectionHeader: 10.5,
  sizeRoleTitle: 9,
  sizeCompanyName: 10,
  sizeSmall: 8.5,
  sizeContact: 8.5,
  lineHeight: 1.15,
  bulletGap: 2.5,
  sectionGapBefore: 10,
  sectionGapAfter: 3,
  sectionRuleGap: 1,
  roleGap: 7,
  roleHeaderGap: 1,
  roleLineGapAfter: 3,
  paragraphGap: 8,
  contactGapAfter: 6,
  competencyGap: 1,
  projectGap: 3,
  marginTop: 0.45,
  marginBottom: 0.45,
  marginLeft: 0.75,
  marginRight: 0.75,
  colorBody: '333333',
  colorHeading: '1a1a1a',
  colorSection: '2b5797',
  colorDim: '666666',
  colorRule: '2b5797',
  roleTitleColor: '1a1a1a',
  datesColor: '666666',
  subtitleColor: '666666',
  competencyLabelColor: '1a1a1a',
  projectUrlColor: '2b5797',
  sectionHeaderStyle: 'caps-rule',
  sectionHeaderLetterSpacing: 3,
  sectionRuleWeight: 0.5,
  nameLetterSpacing: 4,
  nameBold: true,
  nameAlignment: 'center',
  contactAlignment: 'center',
  roleTitleItalic: true,
  datesAlignment: 'right-tab',
  subtitleItalic: true,
  companyBold: true,
  bulletChar: '•',
  bulletIndent: 18,
  bulletHanging: 10,
  competencyLabelBold: true,
  projectNameBold: true,
  projectUrlSize: 8.5,
  educationSchoolBold: true,
})

const createMeta = (): ResumeMeta => ({
  name: 'Jane Example',
  email: 'jane@example.com',
  phone: '555-000-1111',
  location: 'Austin, TX',
  links: [
    { label: 'GitHub', url: 'github.com/jane' },
    { label: 'Unsafe', url: 'javascript:alert(1)' },
  ],
})

const createTemplate = (): CoverLetterTemplate => ({
  id: 'template-1',
  name: 'Base Letter',
  header: 'Ignored in renderer',
  greeting: 'Dear Hiring Manager,',
  paragraphs: [
    {
      id: 'paragraph-1',
      text: 'Example paragraph.',
      vectors: {},
    },
  ],
  signOff: 'Sincerely,\nJane Example',
})

describe('letterPdfRenderer', () => {
  beforeEach(() => {
    snippetInstances.length = 0
    vi.resetModules()
  })

  it('passes sanitized contact links through the letter PDF payload', async () => {
    const { renderLetterAsPdf } = await loadRenderer()

    await renderLetterAsPdf(createTemplate(), createTheme(), createMeta(), 'backend')

    const args = snippetInstances[0]?.lastPdfArgs
    const dataPayload = JSON.parse(args?.inputs?.data ?? '{}') as {
      contactLinks: Array<{ text: string; href: string }>
    }

    expect(dataPayload.contactLinks).toEqual([
      {
        text: 'GitHub: github.com/jane',
        href: 'https://github.com/jane',
      },
    ])
  })
})
