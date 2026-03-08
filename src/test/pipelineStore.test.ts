import { describe, it, expect, beforeEach } from 'vitest'
import { usePipelineStore } from '../store/pipelineStore'
import type { PipelineEntry } from '../types/pipeline'

const makeEntry = (overrides: Partial<PipelineEntry> = {}): Omit<PipelineEntry, 'id' | 'createdAt' | 'lastAction' | 'history'> => ({
  company: 'Acme Corp',
  role: 'Staff Engineer',
  tier: '1',
  status: 'researching',
  comp: '$170K–$210K',
  url: 'https://example.com',
  contact: '',
  vectorId: null,
  jobDescription: '',
  presetId: null,
  resumeVariant: '',
  positioning: '',
  skillMatch: '',
  nextStep: '',
  notes: '',
  appMethod: 'direct-apply',
  response: 'none',
  daysToResponse: null,
  rounds: null,
  format: [],
  rejectionStage: '',
  rejectionReason: '',
  offerAmount: '',
  dateApplied: '',
  dateClosed: '',
  ...overrides,
})

describe('pipelineStore', () => {
  beforeEach(() => {
    usePipelineStore.setState({ entries: [], sortField: 'tier', sortDir: 'asc', filters: { tier: 'all', status: 'all', search: '' } })
  })

  it('adds an entry with generated id, createdAt, lastAction, and history', () => {
    usePipelineStore.getState().addEntry(makeEntry())
    const entries = usePipelineStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toMatch(/^pipe-/)
    expect(entries[0].createdAt).toBeTruthy()
    expect(entries[0].lastAction).toBeTruthy()
    expect(entries[0].history).toHaveLength(1)
    expect(entries[0].history[0].note).toBe('Created')
    expect(entries[0].company).toBe('Acme Corp')
  })

  it('updates an entry and bumps lastAction', () => {
    usePipelineStore.getState().addEntry(makeEntry())
    const id = usePipelineStore.getState().entries[0].id
    usePipelineStore.getState().updateEntry(id, { company: 'Initech' })
    const updated = usePipelineStore.getState().entries[0]
    expect(updated.company).toBe('Initech')
  })

  it('deletes an entry', () => {
    usePipelineStore.getState().addEntry(makeEntry())
    usePipelineStore.getState().addEntry(makeEntry({ company: 'Other' }))
    expect(usePipelineStore.getState().entries).toHaveLength(2)
    const id = usePipelineStore.getState().entries[0].id
    usePipelineStore.getState().deleteEntry(id)
    expect(usePipelineStore.getState().entries).toHaveLength(1)
    expect(usePipelineStore.getState().entries[0].company).toBe('Other')
  })

  it('adds a history note', () => {
    usePipelineStore.getState().addEntry(makeEntry())
    const id = usePipelineStore.getState().entries[0].id
    usePipelineStore.getState().addHistoryNote(id, 'Recruiter call')
    const entry = usePipelineStore.getState().entries[0]
    expect(entry.history).toHaveLength(2)
    expect(entry.history[1].note).toBe('Recruiter call')
  })

  it('sets status and adds history entry', () => {
    usePipelineStore.getState().addEntry(makeEntry())
    const id = usePipelineStore.getState().entries[0].id
    usePipelineStore.getState().setStatus(id, 'applied')
    const entry = usePipelineStore.getState().entries[0]
    expect(entry.status).toBe('applied')
    expect(entry.history).toHaveLength(2)
    expect(entry.history[1].note).toContain('applied')
  })

  it('sets sort field and toggles direction', () => {
    usePipelineStore.getState().setSort('company')
    expect(usePipelineStore.getState().sortField).toBe('company')
    expect(usePipelineStore.getState().sortDir).toBe('asc')
    usePipelineStore.getState().setSort('company')
    expect(usePipelineStore.getState().sortDir).toBe('desc')
  })

  it('sets filters', () => {
    usePipelineStore.getState().setFilter('tier', '1')
    expect(usePipelineStore.getState().filters.tier).toBe('1')
    usePipelineStore.getState().setFilter('search', 'acme')
    expect(usePipelineStore.getState().filters.search).toBe('acme')
  })

  it('imports entries replacing existing', () => {
    usePipelineStore.getState().addEntry(makeEntry())
    expect(usePipelineStore.getState().entries).toHaveLength(1)
    const imported: PipelineEntry[] = [
      { ...makeEntry({ company: 'Imported' }), id: 'pipe-imp-1', createdAt: '2026-01-01', lastAction: '2026-01-01', history: [] },
    ]
    usePipelineStore.getState().importEntries(imported)
    expect(usePipelineStore.getState().entries).toHaveLength(1)
    expect(usePipelineStore.getState().entries[0].company).toBe('Imported')
  })

  it('exports entries', () => {
    usePipelineStore.getState().addEntry(makeEntry())
    usePipelineStore.getState().addEntry(makeEntry({ company: 'Two' }))
    const exported = usePipelineStore.getState().exportEntries()
    expect(exported).toHaveLength(2)
  })
})
