import { describe, expect, it, beforeEach } from 'vitest'
import { useCoverLetterStore } from '../store/coverLetterStore'
import type { CoverLetterTemplate } from '../types/coverLetter'

describe('coverLetterStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useCoverLetterStore.setState({ templates: [] })
  })

  it('starts with an empty template array', () => {
    const state = useCoverLetterStore.getState()
    expect(state.templates).toEqual([])
  })

  it('can add a template', () => {
    const template: CoverLetterTemplate = {
      id: 't1',
      name: 'Test Template',
      header: 'H',
      greeting: 'G',
      paragraphs: [],
      signOff: 'S'
    }

    useCoverLetterStore.getState().addTemplate(template)
    
    const state = useCoverLetterStore.getState()
    expect(state.templates.length).toBe(1)
    expect(state.templates[0]).toEqual(template)
  })

  it('can update a template', () => {
    const template: CoverLetterTemplate = {
      id: 't1',
      name: 'Test Template',
      header: 'H',
      greeting: 'G',
      paragraphs: [],
      signOff: 'S'
    }

    const store = useCoverLetterStore.getState()
    store.addTemplate(template)
    
    store.updateTemplate('t1', { name: 'Updated Template', greeting: 'Hi' })
    
    const updatedState = useCoverLetterStore.getState()
    expect(updatedState.templates[0].name).toBe('Updated Template')
    expect(updatedState.templates[0].greeting).toBe('Hi')
    expect(updatedState.templates[0].header).toBe('H') // untouched
  })

  it('can delete a template', () => {
    const template1: CoverLetterTemplate = { id: 't1', name: 'T1', header: '', greeting: '', paragraphs: [], signOff: '' }
    const template2: CoverLetterTemplate = { id: 't2', name: 'T2', header: '', greeting: '', paragraphs: [], signOff: '' }

    const store = useCoverLetterStore.getState()
    store.addTemplate(template1)
    store.addTemplate(template2)
    
    store.deleteTemplate('t1')
    
    const updatedState = useCoverLetterStore.getState()
    expect(updatedState.templates.length).toBe(1)
    expect(updatedState.templates[0].id).toBe('t2')
  })

  it('can import templates', () => {
    const templates: CoverLetterTemplate[] = [
      { id: 't1', name: 'T1', header: '', greeting: '', paragraphs: [], signOff: '' },
      { id: 't2', name: 'T2', header: '', greeting: '', paragraphs: [], signOff: '' }
    ]

    useCoverLetterStore.getState().importTemplates(templates)
    
    const state = useCoverLetterStore.getState()
    expect(state.templates.length).toBe(2)
    expect(state.templates).toEqual(templates)
  })
})