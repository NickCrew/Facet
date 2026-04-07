// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { HomePage } from '../routes/home/HomePage'
import { useCoverLetterStore } from '../store/coverLetterStore'
import { useDebriefStore } from '../store/debriefStore'
import { useIdentityStore } from '../store/identityStore'
import { useLinkedInStore } from '../store/linkedinStore'
import { useMatchStore } from '../store/matchStore'
import { usePipelineStore } from '../store/pipelineStore'
import { useRecruiterStore } from '../store/recruiterStore'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

describe('HomePage', () => {
  beforeEach(() => {
    useIdentityStore.setState({
      intakeMode: 'upload',
      sourceMaterial: '',
      correctionNotes: '',
      currentIdentity: null,
      draft: null,
      draftDocument: '',
      scanResult: null,
      warnings: [],
      changelog: [],
      lastError: null,
    })
    useMatchStore.setState({
      jobDescription: '',
      currentReport: null,
      warnings: [],
      history: [],
    })
    usePipelineStore.setState({
      entries: [],
      sortField: 'tier',
      sortDir: 'asc',
      filters: { tier: 'all', status: 'all', search: '' },
    })
    useCoverLetterStore.setState({ templates: [] })
    useLinkedInStore.setState({ drafts: [], selectedDraftId: null })
    useRecruiterStore.setState({ cards: [], selectedCardId: null })
    useDebriefStore.setState({ sessions: [], selectedSessionId: null })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the main workflow entry points', () => {
    render(<HomePage />)

    const startFromResumeLinks = screen.getAllByRole('link', { name: /start from resume/i })
    expect(startFromResumeLinks[0]?.getAttribute('href')).toBe('/identity')
    expect(screen.getByRole('link', { name: /start from job description/i }).getAttribute('href')).toBe('/match')
    expect(screen.getByRole('link', { name: /open resume builder/i }).getAttribute('href')).toBe('/build')
  })

  it('offers a resume CTA when identity work already exists', () => {
    useIdentityStore.setState({
      sourceMaterial: 'Senior platform engineer resume text',
    })

    render(<HomePage />)

    expect(screen.getByRole('link', { name: /resume where you left off/i }).getAttribute('href')).toBe('/identity')
    expect(screen.getByText(/continue scanning, editing, or deepening your identity model/i)).toBeTruthy()
  })
})
