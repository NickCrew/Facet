import type { TemplateId } from '../types'
import resumeTemplate from './resume.typ?raw'
import sidebarTemplate from './sidebar.typ?raw'
import minimalistTemplate from './minimalist.typ?raw'

export interface TemplateMetadata {
  id: TemplateId
  name: string
  description: string
  content: string
}

export const TEMPLATES: Record<TemplateId, TemplateMetadata> = {
  classic: {
    id: 'classic',
    name: 'Classic Standard',
    description: 'Traditional single-column layout, highly ATS-compatible.',
    content: resumeTemplate,
  },
  sidebar: {
    id: 'sidebar',
    name: 'Modern Sidebar',
    description: 'Two-column layout with a sleek sidebar for skills and contact info.',
    content: sidebarTemplate,
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist Executive',
    description: 'Clean, uppercase-focused layout for senior roles.',
    content: minimalistTemplate,
  },
}

export const DEFAULT_TEMPLATE_ID: TemplateId = 'classic'
