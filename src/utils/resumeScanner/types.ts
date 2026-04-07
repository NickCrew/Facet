import type { ProfessionalIdentityV3 } from '../../identity/schema'
import type { ResumeScanResult } from '../../types/identity'

export interface ResumeTextItem {
  text: string
  x: number
  y: number
  width: number
  height: number
  page: number
  fontName?: string
}

export interface ResumeLine {
  page: number
  y: number
  x: number
  width: number
  text: string
  items: ResumeTextItem[]
}

export interface ResumeSection {
  key: 'header' | 'summary' | 'experience' | 'skills' | 'education' | 'projects' | 'other'
  heading: string | null
  lines: ResumeLine[]
}

export interface ParsedResumeRole {
  company: string
  title: string
  dates: string
  subtitle?: string
  bullets: string[]
}

export interface ParsedResumeEducation {
  school: string
  location: string
  degree: string
  year?: string
}

export interface ParsedResumeSkillGroup {
  label: string
  items: string[]
}

export interface ParsedResumeProject {
  name: string
  description: string
  url?: string
}

export interface ParsedResumeContact {
  name: string
  title?: string
  email: string
  phone: string
  location: string
  links: ProfessionalIdentityV3['identity']['links']
  thesis: string
}

export interface ResumeScanParseResult {
  rawText: string
  identity: ProfessionalIdentityV3
  warnings: ResumeScanResult['warnings']
  layout: ResumeScanResult['layout']
}
