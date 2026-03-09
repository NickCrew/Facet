import type { CoverLetterTemplate } from '../types/coverLetter'
import type { VectorId, ResumeMeta } from '../types'

export interface CoverLetterAssemblyOptions {
  vectorId: VectorId
  meta: ResumeMeta
  variables?: Record<string, string>
}

export function assembleCoverLetter(
  template: CoverLetterTemplate,
  options: CoverLetterAssemblyOptions
): string {
  const { vectorId, variables = {} } = options
  
  // Resolve variables helper
  const resolve = (text: string) => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim()
      return variables[trimmedKey] ?? match
    })
  }

  const lines: string[] = []

  // Header
  lines.push(resolve(template.header))
  lines.push('')

  // Date
  lines.push(new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }))
  lines.push('')

  // Greeting
  lines.push(resolve(template.greeting))
  lines.push('')

  // Paragraphs
  const filteredParagraphs = template.paragraphs.filter(p => {
    const priority = p.vectors[vectorId]
    return priority === 'must' || priority === 'strong' || priority === 'optional'
  })

  // Fallback to all paragraphs if none are tagged for this vector
  // or if we want a default behavior? 
  // Actually, usually we'd want a "default" paragraph.
  const paragraphsToRender = filteredParagraphs.length > 0 
    ? filteredParagraphs 
    : template.paragraphs.filter(p => !Object.keys(p.vectors).length)

  for (const p of paragraphsToRender) {
    lines.push(resolve(p.text))
    lines.push('')
  }

  // Sign off
  lines.push(resolve(template.signOff))

  return lines.join('\n').trim()
}
