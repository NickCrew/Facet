// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { IdentityPage } from '../routes/identity/IdentityPage'
import { useIdentityStore } from '../store/identityStore'
import { useResumeStore } from '../store/resumeStore'
import { useUiStore } from '../store/uiStore'
import { resolveStorage } from '../store/storage'
import { cloneIdentityFixture } from './fixtures/identityFixture'
import type { ResumeScanResult } from '../types/identity'

const navigateMock = vi.fn(async () => undefined)
const identityExtractionMocks = vi.hoisted(() => ({
  generateIdentityDraftMock: vi.fn(),
}))
const resumeScannerMocks = vi.hoisted(() => ({
  scanResumePdfMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('../utils/identityExtraction', async () => {
  const actual = await vi.importActual<typeof import('../utils/identityExtraction')>(
    '../utils/identityExtraction',
  )

  return {
    ...actual,
    generateIdentityDraft: identityExtractionMocks.generateIdentityDraftMock,
  }
})

vi.mock('../utils/resumeScanner', () => ({
  scanResumePdf: resumeScannerMocks.scanResumePdfMock,
}))

const scanFixture = (): ResumeScanResult => {
  const identity = cloneIdentityFixture()
  identity.identity.name = 'Nick Ferguson'
  identity.roles[0].bullets[0].problem = ''
  identity.roles[0].bullets[0].action = ''
  identity.roles[0].bullets[0].outcome = ''
  identity.roles[0].bullets[0].impact = []
  identity.roles[0].bullets[0].source_text =
    'Ported the platform to Kubernetes-based installs.'

  return {
    fileName: 'resume.pdf',
    pageCount: 1,
    scannedAt: '2026-04-05T00:00:00.000Z',
    rawText: 'Nick Ferguson\nExperience\n• Ported the platform to Kubernetes-based installs.',
    identity,
    warnings: [
      {
        code: 'two-column-layout',
        severity: 'warning',
        message: 'This PDF looks like a two-column layout. Resume Scanner v1 only supports single-column resumes, so review the extracted structure carefully.',
      },
    ],
    counts: {
      roles: 1,
      bullets: 1,
      skillGroups: 1,
      education: 0,
      extractedBullets: 1,
      decomposedBullets: 0,
    },
    layout: 'ambiguous-columns',
  }
}

describe('IdentityPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ANTHROPIC_PROXY_URL', 'https://ai.example/proxy')
    resolveStorage().removeItem('facet-identity-workspace')
    useResumeStore.setState((state) => ({ ...state }))
    useUiStore.setState({
      selectedVector: 'all',
      panelRatio: 0.45,
      appearance: 'system',
      viewMode: 'pdf',
      showHeatmap: false,
      showDesignHealth: false,
      suggestionModeActive: false,
      comparisonVector: null,
      backupRemindersEnabled: true,
      backupReminderIntervalDays: 14,
      backupReminderSnoozedUntil: null,
      lastBackupAt: null,
      tourCompleted: false,
    })
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

    identityExtractionMocks.generateIdentityDraftMock.mockResolvedValue({
      generatedAt: '2026-04-05T00:00:00.000Z',
      summary: 'Generated from scan.',
      followUpQuestions: [],
      identity: cloneIdentityFixture(),
      bullets: [],
      warnings: [],
    })
    resumeScannerMocks.scanResumePdfMock.mockResolvedValue(scanFixture())
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    navigateMock.mockReset()
  })

  it('uploads a PDF, populates the scan editor, and uses the scanned identity as the AI seed', async () => {
    const { container } = render(<IdentityPage />)

    const uploadInput = container.querySelector('input[type="file"][accept="application/pdf,.pdf"]')
    expect(uploadInput).toBeTruthy()

    fireEvent.change(uploadInput as HTMLInputElement, {
      target: {
        files: [new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' })],
      },
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Nick Ferguson')).toBeTruthy()
    })

    fireEvent.change(
      screen.getByDisplayValue('Ported the platform to Kubernetes-based installs.'),
      {
        target: { value: 'Ported the platform to Kubernetes-based installs for on-prem customers.' },
      },
    )

    expect(
      useIdentityStore.getState().scanResult?.identity.roles[0]?.bullets[0]?.source_text,
    ).toBe('Ported the platform to Kubernetes-based installs for on-prem customers.')
    expect(screen.getByRole('alert').textContent).toContain('two-column layout')

    fireEvent.click(screen.getByText('Generate Draft'))

    await waitFor(() => {
      expect(identityExtractionMocks.generateIdentityDraftMock).toHaveBeenCalledTimes(1)
    })

    expect(identityExtractionMocks.generateIdentityDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMaterial: 'Nick Ferguson\nExperience\n• Ported the platform to Kubernetes-based installs.',
        seedIdentity: expect.objectContaining({
          roles: [
            expect.objectContaining({
              bullets: [
                expect.objectContaining({
                  source_text: 'Ported the platform to Kubernetes-based installs for on-prem customers.',
                }),
              ],
            }),
          ],
        }),
      }),
    )
  })

  it('falls back to paste-text mode when scan text exists but role parsing fails', async () => {
    const fallback = scanFixture()
    fallback.identity.roles = []
    fallback.counts.roles = 0
    fallback.counts.bullets = 0
    fallback.counts.extractedBullets = 0
    fallback.warnings = [
      {
        code: 'role-parse-fallback',
        severity: 'warning',
        message:
          'Resume text extraction succeeded, but role parsing did not. The app will fall back to paste-text mode with the raw extracted text.',
      },
    ]
    resumeScannerMocks.scanResumePdfMock.mockResolvedValue(fallback)

    const { container } = render(<IdentityPage />)
    const uploadInput = container.querySelector('input[type="file"][accept="application/pdf,.pdf"]')

    fireEvent.change(uploadInput as HTMLInputElement, {
      target: {
        files: [new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' })],
      },
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Source Material')).toBeTruthy()
    })

    expect(useIdentityStore.getState().intakeMode).toBe('paste')
    expect(useIdentityStore.getState().scanResult).toBeNull()
    expect(useIdentityStore.getState().sourceMaterial).toContain('Experience')
  })
})
