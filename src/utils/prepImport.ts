import type { PrepCard, PrepCategory } from '../types/prep'

const MAX_IMPORT_BYTES = 2 * 1024 * 1024 // 2 MB

const VALID_CATEGORIES = new Set<string>([
  'opener', 'behavioral', 'technical', 'project', 'metrics', 'situational',
])

/**
 * Validates a single imported prep card. Rejects entries with
 * missing required fields and coerces optional fields to safe defaults.
 */
function validateCard(raw: unknown): PrepCard | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>

  // Required string fields
  if (typeof c.id !== 'string' || !c.id) return null
  if (typeof c.title !== 'string' || !c.title) return null
  if (!VALID_CATEGORIES.has(c.category as string)) return null

  const str = (v: unknown) => (typeof v === 'string' ? v : undefined)

  // Tags must be string array
  const tags = Array.isArray(c.tags)
    ? c.tags.filter((t): t is string => typeof t === 'string')
    : []

  // Follow-ups: array of {question, answer} pairs
  const followUps = Array.isArray(c.followUps)
    ? c.followUps.filter(
        (f): f is { question: string; answer: string } =>
          f && typeof f === 'object' &&
          typeof f.question === 'string' &&
          typeof f.answer === 'string'
      )
    : undefined

  // Deep dives: array of {title, content}
  const deepDives = Array.isArray(c.deepDives)
    ? c.deepDives.filter(
        (d): d is { title: string; content: string } =>
          d && typeof d === 'object' &&
          typeof d.title === 'string' &&
          typeof d.content === 'string'
      )
    : undefined

  // Metrics: array of {value, label}
  const metrics = Array.isArray(c.metrics)
    ? c.metrics.filter(
        (m): m is { value: string; label: string } =>
          m && typeof m === 'object' &&
          typeof m.value === 'string' &&
          typeof m.label === 'string'
      )
    : undefined

  // Table data
  let tableData: PrepCard['tableData'] = undefined
  if (c.tableData && typeof c.tableData === 'object') {
    const td = c.tableData as Record<string, unknown>
    if (
      Array.isArray(td.headers) &&
      td.headers.every((h: unknown) => typeof h === 'string') &&
      Array.isArray(td.rows) &&
      td.rows.every(
        (r: unknown) => Array.isArray(r) && r.every((cell: unknown) => typeof cell === 'string')
      )
    ) {
      tableData = { headers: td.headers as string[], rows: td.rows as string[][] }
    }
  }

  return {
    id: c.id as string,
    category: c.category as PrepCategory,
    title: c.title as string,
    tags,
    script: str(c.script),
    warning: str(c.warning),
    followUps: followUps && followUps.length > 0 ? followUps : undefined,
    deepDives: deepDives && deepDives.length > 0 ? deepDives : undefined,
    metrics: metrics && metrics.length > 0 ? metrics : undefined,
    tableData,
  }
}

export interface PrepImportResult {
  cards: PrepCard[]
  skipped: number
  error: string | null
}

/**
 * Parse and validate a prep cards JSON import file.
 * Returns validated cards with invalid entries skipped.
 */
export function parsePrepImport(file: File): Promise<PrepImportResult> {
  return new Promise((resolve) => {
    if (file.size > MAX_IMPORT_BYTES) {
      resolve({ cards: [], skipped: 0, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 2 MB.` })
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        const raw = Array.isArray(parsed) ? parsed : null
        if (!raw) {
          resolve({ cards: [], skipped: 0, error: 'Expected a JSON array of prep cards.' })
          return
        }
        const cards: PrepCard[] = []
        let skipped = 0
        for (const item of raw) {
          const validated = validateCard(item)
          if (validated) cards.push(validated)
          else skipped++
        }
        if (cards.length === 0 && skipped > 0) {
          resolve({ cards: [], skipped, error: `All ${skipped} cards failed validation.` })
          return
        }
        resolve({ cards, skipped, error: null })
      } catch {
        resolve({ cards: [], skipped: 0, error: 'File is not valid JSON.' })
      }
    }
    reader.readAsText(file)
  })
}
