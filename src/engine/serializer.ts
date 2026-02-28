import { JSON_SCHEMA, dump, load } from 'js-yaml'
import type { ComponentPriority, ResumeData } from '../types'

export type ResumeConfigFormat = 'yaml' | 'json'

export interface ParsedResumeConfig {
  data: ResumeData
  format: ResumeConfigFormat
}

const PRIORITIES = new Set<ComponentPriority>(['must', 'strong', 'optional', 'exclude'])
const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const MAX_CONFIG_INPUT_CHARS = 500_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)

const assertRecord = (value: unknown, context: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(`${context} must be an object.`)
  }

  for (const key of Object.keys(value)) {
    if (FORBIDDEN_OBJECT_KEYS.has(key)) {
      throw new Error(`${context} contains unsupported key "${key}".`)
    }
  }

  return value
}

const assertString = (value: unknown, context: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`${context} must be a string.`)
  }

  return value
}

const assertNumber = (value: unknown, context: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${context} must be a number.`)
  }

  return value
}

const assertArray = (value: unknown, context: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array.`)
  }

  return value
}

const assertOptionalString = (value: unknown, context: string): string | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }

  return assertString(value, context)
}

const assertPriorityMap = (value: unknown, context: string): void => {
  const record = assertRecord(value, context)
  for (const [key, rawPriority] of Object.entries(record)) {
    if (!PRIORITIES.has(rawPriority as ComponentPriority)) {
      throw new Error(`${context}.${key} must be one of: must, strong, optional, exclude.`)
    }
  }
}

const assertOptionalTextVariants = (value: unknown, context: string): void => {
  if (value === undefined || value === null) {
    return
  }

  const record = assertRecord(value, context)
  for (const [key, variant] of Object.entries(record)) {
    assertString(variant, `${context}.${key}`)
  }
}

const assertSkillOrderMap = (value: unknown, context: string): void => {
  const record = assertRecord(value, context)
  for (const [key, order] of Object.entries(record)) {
    if (order === undefined) {
      continue
    }

    assertNumber(order, `${context}.${key}`)
  }
}

function assertResumeDataShape(value: unknown): asserts value is ResumeData {
  const root = assertRecord(value, 'Resume data')
  assertNumber(root.version, 'version')

  const meta = assertRecord(root.meta, 'meta')
  assertString(meta.name, 'meta.name')
  assertString(meta.email, 'meta.email')
  assertString(meta.phone, 'meta.phone')
  assertString(meta.location, 'meta.location')
  const links = assertArray(meta.links, 'meta.links')
  for (const [index, link] of links.entries()) {
    const linkRecord = assertRecord(link, `meta.links[${index}]`)
    assertString(linkRecord.label, `meta.links[${index}].label`)
    assertString(linkRecord.url, `meta.links[${index}].url`)
  }

  const vectors = assertArray(root.vectors, 'vectors')
  for (const [index, vector] of vectors.entries()) {
    const vectorRecord = assertRecord(vector, `vectors[${index}]`)
    assertString(vectorRecord.id, `vectors[${index}].id`)
    assertString(vectorRecord.label, `vectors[${index}].label`)
    assertString(vectorRecord.color, `vectors[${index}].color`)
  }

  const targetLines = assertArray(root.target_lines, 'target_lines')
  for (const [index, targetLine] of targetLines.entries()) {
    const record = assertRecord(targetLine, `target_lines[${index}]`)
    assertString(record.id, `target_lines[${index}].id`)
    assertString(record.text, `target_lines[${index}].text`)
    assertPriorityMap(record.vectors, `target_lines[${index}].vectors`)
    assertOptionalTextVariants(record.variants, `target_lines[${index}].variants`)
  }

  const profiles = assertArray(root.profiles, 'profiles')
  for (const [index, profile] of profiles.entries()) {
    const record = assertRecord(profile, `profiles[${index}]`)
    assertString(record.id, `profiles[${index}].id`)
    assertString(record.text, `profiles[${index}].text`)
    assertPriorityMap(record.vectors, `profiles[${index}].vectors`)
    assertOptionalTextVariants(record.variants, `profiles[${index}].variants`)
  }

  const skillGroups = assertArray(root.skill_groups, 'skill_groups')
  for (const [index, skillGroup] of skillGroups.entries()) {
    const record = assertRecord(skillGroup, `skill_groups[${index}]`)
    assertString(record.id, `skill_groups[${index}].id`)
    assertString(record.label, `skill_groups[${index}].label`)
    assertString(record.content, `skill_groups[${index}].content`)
    assertSkillOrderMap(record.order, `skill_groups[${index}].order`)
  }

  const roles = assertArray(root.roles, 'roles')
  for (const [roleIndex, role] of roles.entries()) {
    const record = assertRecord(role, `roles[${roleIndex}]`)
    assertString(record.id, `roles[${roleIndex}].id`)
    assertString(record.company, `roles[${roleIndex}].company`)
    assertString(record.title, `roles[${roleIndex}].title`)
    assertString(record.dates, `roles[${roleIndex}].dates`)
    assertOptionalString(record.subtitle, `roles[${roleIndex}].subtitle`)

    const bullets = assertArray(record.bullets, `roles[${roleIndex}].bullets`)
    for (const [bulletIndex, bullet] of bullets.entries()) {
      const bulletRecord = assertRecord(bullet, `roles[${roleIndex}].bullets[${bulletIndex}]`)
      assertString(bulletRecord.id, `roles[${roleIndex}].bullets[${bulletIndex}].id`)
      assertString(bulletRecord.text, `roles[${roleIndex}].bullets[${bulletIndex}].text`)
      assertPriorityMap(
        bulletRecord.vectors,
        `roles[${roleIndex}].bullets[${bulletIndex}].vectors`,
      )
      assertOptionalTextVariants(
        bulletRecord.variants,
        `roles[${roleIndex}].bullets[${bulletIndex}].variants`,
      )
    }
  }

  const projects = assertArray(root.projects, 'projects')
  for (const [index, project] of projects.entries()) {
    const record = assertRecord(project, `projects[${index}]`)
    assertString(record.id, `projects[${index}].id`)
    assertString(record.name, `projects[${index}].name`)
    assertOptionalString(record.url, `projects[${index}].url`)
    assertString(record.text, `projects[${index}].text`)
    assertPriorityMap(record.vectors, `projects[${index}].vectors`)
    assertOptionalTextVariants(record.variants, `projects[${index}].variants`)
  }

  const education = assertArray(root.education, 'education')
  for (const [index, entry] of education.entries()) {
    const record = assertRecord(entry, `education[${index}]`)
    assertString(record.school, `education[${index}].school`)
    assertString(record.location, `education[${index}].location`)
    assertString(record.degree, `education[${index}].degree`)
    assertString(record.year, `education[${index}].year`)
  }
}

const detectFormat = (raw: string): ResumeConfigFormat =>
  raw.startsWith('{') || raw.startsWith('[') ? 'json' : 'yaml'

export const importResumeConfig = (
  input: string,
  expectedFormat?: ResumeConfigFormat,
): ParsedResumeConfig => {
  const raw = input.trim()
  if (raw.length === 0) {
    throw new Error('Resume config input is empty.')
  }
  if (raw.length > MAX_CONFIG_INPUT_CHARS) {
    throw new Error(`Resume config input is too large (max ${MAX_CONFIG_INPUT_CHARS} characters).`)
  }

  const format = expectedFormat ?? detectFormat(raw)

  let parsed: unknown
  try {
    parsed = format === 'json' ? JSON.parse(raw) : load(raw, { schema: JSON_SCHEMA })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse ${format.toUpperCase()}: ${detail}`)
  }

  assertResumeDataShape(parsed)
  return {
    data: parsed as ResumeData,
    format,
  }
}

export const exportResumeConfig = (
  data: ResumeData,
  format: ResumeConfigFormat = 'yaml',
): string => {
  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }

  return dump(data, {
    lineWidth: 110,
    noRefs: true,
    sortKeys: false,
  })
}
