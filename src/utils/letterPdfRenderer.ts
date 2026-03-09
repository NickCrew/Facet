import type { CoverLetterTemplate } from '../types/coverLetter'
import { getThemeFontFiles } from '../themes/theme'
import { getTypstSnippet, toPdfPageCount } from './typstRendererUtils'
import { TEMPLATES } from '../templates/registry'
import type { ResumeTheme, ResumeMeta, VectorId } from '../types'
import { toThemePayload } from './typstRenderer'

const PDF_MIME_TYPE = 'application/pdf'

export interface LetterDataPayload {
  metadata: {
    title: string
    author: string
  }
  name: string
  contactLine: string | null
  contactLinks: Array<{ text: string; href: string }>
  date: string
  recipient: string | null
  greeting: string
  paragraphs: string[]
  signOff: string
}

export const renderLetterAsPdf = async (
  template: CoverLetterTemplate,
  theme: ResumeTheme,
  meta: ResumeMeta,
  vectorId: VectorId,
  recipient: string = '',
  variables: Record<string, string> = {}
) => {
  const fontFiles = getThemeFontFiles(theme)
  const snippet = await getTypstSnippet(fontFiles)
  
  // Assemble paragraphs based on vector
  const filteredParagraphs = template.paragraphs.filter(p => {
    const priority = p.vectors[vectorId]
    return priority === 'must' || priority === 'strong' || priority === 'optional'
  })

  const paragraphsToRender = filteredParagraphs.length > 0 
    ? filteredParagraphs 
    : template.paragraphs.filter(p => !Object.keys(p.vectors).length)

  // Resolve variables
  const resolve = (text: string) => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim()
      return variables[trimmedKey] ?? match
    })
  }

  const dataPayload: LetterDataPayload = {
    metadata: {
      title: `${template.name} - ${meta.name}`,
      author: meta.name
    },
    name: meta.name,
    contactLine: [meta.location, meta.email, meta.phone].filter(Boolean).join(' | '),
    contactLinks: [], // We can wire these up later if needed
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    recipient: resolve(recipient),
    greeting: resolve(template.greeting),
    paragraphs: paragraphsToRender.map(p => resolve(p.text)),
    signOff: resolve(template.signOff)
  }

  const themePayload = toThemePayload(theme)
  const typstTemplate = TEMPLATES.letter

  const pdfBytes = await snippet.pdf({
    mainContent: typstTemplate.content,
    inputs: {
      data: JSON.stringify(dataPayload),
      theme: JSON.stringify(themePayload),
    },
  })

  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('Typst renderer produced an empty PDF output.')
  }

  const bytes = new Uint8Array(pdfBytes)
  const blob = new Blob([bytes], { type: PDF_MIME_TYPE })

  return {
    blob,
    bytes,
    pageCount: toPdfPageCount(bytes),
    generatedAt: new Date().toISOString(),
  }
}
