// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { defaultResumeData } from '../store/defaultData'
import { useCoverLetterStore } from '../store/coverLetterStore'
import { usePipelineStore } from '../store/pipelineStore'
import { usePrepStore } from '../store/prepStore'
import { useResumeStore } from '../store/resumeStore'
import { useSearchStore } from '../store/searchStore'
import { resolveStorage } from '../store/storage'
import { useUiStore } from '../store/uiStore'
import {
  applyWorkspacePatch,
  createInMemoryPersistenceBackend,
  createPersistenceCoordinator,
} from '../persistence/coordinator'
import { DEFAULT_LOCAL_WORKSPACE_ID } from '../persistence/contracts'
import {
  createLocalPreferencesSnapshotFromStores,
  createWorkspaceSnapshotFromStores,
  DURABLE_PERSISTENCE_BOUNDARIES,
  LEGACY_PERSISTENCE_MIGRATION_PLAN,
  LOCAL_ONLY_PERSISTENCE_BOUNDARIES,
} from '../persistence/snapshot'
import { assertValidWorkspaceSnapshot } from '../persistence/validation'

describe('persistence foundation', () => {
  beforeEach(() => {
    const storage = resolveStorage()
    for (const key of [
      'vector-resume-data',
      'vector-resume-ui',
      'facet-pipeline-data',
      'facet-prep-workspace',
      'facet-prep-data',
      'facet-cover-letter-data',
      'facet-search-data',
    ]) {
      storage.removeItem(key)
    }

    useResumeStore.setState({
      data: defaultResumeData,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    })
    usePipelineStore.setState({
      entries: [],
      sortField: 'tier',
      sortDir: 'asc',
      filters: { tier: 'all', status: 'all', search: '' },
    })
    usePrepStore.setState({
      decks: [],
      activeDeckId: null,
    })
    useCoverLetterStore.setState({
      templates: [],
    })
    useSearchStore.setState({
      profile: null,
      requests: [],
      runs: [],
    })
    useUiStore.setState({
      selectedVector: 'all',
      panelRatio: 0.45,
      appearance: 'system',
      viewMode: 'pdf',
      showHeatmap: false,
      showDesignHealth: false,
      suggestionModeActive: false,
      comparisonVector: null,
      tourCompleted: false,
    })
  })

  it('captures only durable workspace artifacts in the unified snapshot', () => {
    usePipelineStore.setState({
      entries: [
        {
          id: 'pipe-1',
          company: 'Acme',
          role: 'Staff Engineer',
          tier: '1',
          status: 'applied',
          comp: '$250k',
          url: 'https://example.com/jobs/1',
          contact: 'recruiter@example.com',
          vectorId: 'backend',
          jobDescription: 'Build platforms',
          presetId: null,
          resumeVariant: 'default',
          positioning: 'Platform-heavy fit',
          skillMatch: 'Strong',
          nextStep: 'Wait',
          notes: 'Strong fit',
          appMethod: 'direct-apply',
          response: 'none',
          daysToResponse: null,
          rounds: null,
          format: [],
          rejectionStage: '',
          rejectionReason: '',
          offerAmount: '',
          dateApplied: '2026-03-11',
          dateClosed: '',
          lastAction: '2026-03-11',
          createdAt: '2026-03-11',
          history: [{ date: '2026-03-11', note: 'Created' }],
        },
      ],
      sortField: 'company',
      sortDir: 'desc',
      filters: { tier: '1', status: 'applied', search: 'Acme' },
    })
    usePrepStore.setState({
      decks: [
        {
          id: 'prep-deck-1',
          title: 'Interview Prep',
          company: 'Acme',
          role: 'Staff Engineer',
          vectorId: 'backend',
          pipelineEntryId: 'pipe-1',
          updatedAt: '2026-03-11T00:00:00.000Z',
          cards: [],
        },
      ],
      activeDeckId: 'prep-deck-1',
    })
    useCoverLetterStore.setState({
      templates: [
        {
          id: 'letter-1',
          name: 'Default',
          header: 'Header',
          greeting: 'Hello',
          paragraphs: [],
          signOff: 'Thanks',
        },
      ],
    })
    useSearchStore.setState({
      profile: {
        id: 'sprof-1',
        skills: [],
        vectors: [],
        workSummary: [],
        openQuestions: [],
        constraints: {
          compensation: '$250k',
          locations: ['Remote'],
          clearance: '',
          companySize: '',
        },
        filters: {
          prioritize: ['platform'],
          avoid: ['ad-tech'],
        },
        interviewPrefs: {
          strongFit: ['ownership'],
          redFlags: ['low scope'],
        },
        inferredAt: '2026-03-11T00:00:00.000Z',
        inferredFromResumeVersion: defaultResumeData.version,
      },
      requests: [],
      runs: [],
    })
    useUiStore.setState({
      selectedVector: 'backend',
      panelRatio: 0.6,
      appearance: 'dark',
      viewMode: 'live',
      showHeatmap: true,
      showDesignHealth: true,
      suggestionModeActive: true,
      comparisonVector: 'all',
      tourCompleted: true,
    })

    const snapshot = createWorkspaceSnapshotFromStores({
      workspaceId: 'ws-1',
      workspaceName: 'Acme Workspace',
      exportedAt: '2026-03-11T12:00:00.000Z',
    })

    expect(snapshot.snapshotVersion).toBe(1)
    expect(snapshot.tenantId).toBeNull()
    expect(snapshot.userId).toBeNull()
    expect(snapshot.workspace).toEqual({
      id: 'ws-1',
      name: 'Acme Workspace',
      revision: 0,
      updatedAt: '2026-03-11T12:00:00.000Z',
    })
    expect(snapshot.artifacts.resume.artifactId).toBe('ws-1:resume')
    expect(snapshot.artifacts.pipeline.payload.entries).toHaveLength(1)
    expect(snapshot.artifacts.prep.payload.decks).toHaveLength(1)
    expect(snapshot.artifacts.coverLetters.payload.templates).toHaveLength(1)
    expect(snapshot.artifacts.research.payload.profile?.id).toBe('sprof-1')
    expect(snapshot.artifacts.pipeline.payload).not.toHaveProperty('sortField')
    expect(snapshot.artifacts.prep.payload).not.toHaveProperty('activeDeckId')

    snapshot.artifacts.resume.payload.meta.name = 'Changed in snapshot'
    expect(useResumeStore.getState().data.meta.name).toBe(defaultResumeData.meta.name)
  })

  it('captures local-only preferences separately from durable workspace content', () => {
    useUiStore.setState({
      selectedVector: 'backend',
      panelRatio: 0.55,
      appearance: 'dark',
      viewMode: 'live',
      showHeatmap: true,
      showDesignHealth: false,
      suggestionModeActive: true,
      comparisonVector: 'all',
      tourCompleted: true,
    })
    usePipelineStore.setState({
      entries: [],
      sortField: 'company',
      sortDir: 'desc',
      filters: { tier: 'all', status: 'all', search: '' },
    })
    usePrepStore.setState({
      decks: [],
      activeDeckId: 'prep-deck-1',
    })

    const snapshot = createLocalPreferencesSnapshotFromStores('ws-1', '2026-03-11T12:00:00.000Z')

    expect(snapshot.workspaceId).toBe('ws-1')
    expect(snapshot.ui.selectedVector).toBe('backend')
    expect(snapshot.pipeline.sortField).toBe('company')
    expect(snapshot.prep.activeDeckId).toBe('prep-deck-1')
    expect(snapshot.ui).not.toHaveProperty('comparisonVector')
  })

  it('documents the migration map from legacy storage keys', () => {
    expect(DURABLE_PERSISTENCE_BOUNDARIES.map((entry) => entry.source)).toEqual([
      'resumeStore.data',
      'pipelineStore.entries',
      'prepStore.decks',
      'coverLetterStore.templates',
      'searchStore.profile,requests,runs',
    ])
    expect(LOCAL_ONLY_PERSISTENCE_BOUNDARIES.map((entry) => entry.target)).toEqual([
      'localPreferences.ui',
      'excluded',
      'localPreferences.pipeline',
      'localPreferences.prep',
    ])
    expect(LEGACY_PERSISTENCE_MIGRATION_PLAN.map((entry) => entry.storageKey)).toEqual([
      'vector-resume-data',
      'facet-pipeline-data',
      'facet-prep-workspace',
      'facet-prep-data',
      'facet-cover-letter-data',
      'facet-search-data',
      'vector-resume-ui',
    ])
  })

  it('applies workspace patches immutably across workspace metadata and artifacts', () => {
    const snapshot = createWorkspaceSnapshotFromStores({
      workspaceId: 'ws-1',
      exportedAt: '2026-03-11T12:00:00.000Z',
    })

    const patched = applyWorkspacePatch(snapshot, {
      tenantId: 'tenant-1',
      userId: 'user-1',
      workspace: {
        name: 'Team Workspace',
      },
      artifacts: {
        pipeline: {
          revision: 4,
        },
      },
    })

    expect(patched.tenantId).toBe('tenant-1')
    expect(patched.userId).toBe('user-1')
    expect(patched.workspace.name).toBe('Team Workspace')
    expect(patched.artifacts.pipeline.revision).toBe(4)
    expect(snapshot.tenantId).toBeNull()
    expect(snapshot.userId).toBeNull()
    expect(snapshot.workspace.name).toBe('Facet Local Workspace')
    expect(snapshot.artifacts.pipeline.revision).toBe(0)
  })

  it('provides a backend-agnostic persistence coordinator', async () => {
    const backend = createInMemoryPersistenceBackend()
    const coordinator = createPersistenceCoordinator({
      backend,
      readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
    })

    const exported = await coordinator.exportWorkspaceSnapshot({
      workspaceId: DEFAULT_LOCAL_WORKSPACE_ID,
      exportedAt: '2026-03-11T12:00:00.000Z',
    })
    expect(exported.workspace.id).toBe(DEFAULT_LOCAL_WORKSPACE_ID)

    const saved = await coordinator.saveWorkspacePatch(DEFAULT_LOCAL_WORKSPACE_ID, {
      workspace: {
        name: 'Team Workspace',
      },
      tenantId: 'tenant-1',
      userId: 'user-1',
    })

    expect(saved.workspace.name).toBe('Team Workspace')
    expect(saved.workspace.revision).toBe(1)
    expect(saved.tenantId).toBe('tenant-1')
    expect(saved.userId).toBe('user-1')
    expect(saved.workspace.updatedAt).not.toBe('2026-03-11T12:00:00.000Z')

    const bootstrapped = await coordinator.bootstrap(DEFAULT_LOCAL_WORKSPACE_ID)
    expect(bootstrapped.snapshot?.workspace.name).toBe('Team Workspace')
    expect(bootstrapped.status.phase).toBe('ready')
  })

  it('increments revision from the persisted snapshot, not from the patch payload', async () => {
    const backend = createInMemoryPersistenceBackend()
    const coordinator = createPersistenceCoordinator({
      backend,
      readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
    })

    const first = await coordinator.saveWorkspacePatch(DEFAULT_LOCAL_WORKSPACE_ID, {
      workspace: {
        name: 'First save',
      },
    })
    const second = await coordinator.saveWorkspacePatch(DEFAULT_LOCAL_WORKSPACE_ID, {
      workspace: {
        name: 'Second save',
      },
    })

    expect(first.workspace.revision).toBe(1)
    expect(second.workspace.revision).toBe(2)
  })

  it('imports validated workspace snapshots in replace and merge modes', async () => {
    const backend = createInMemoryPersistenceBackend()
    const coordinator = createPersistenceCoordinator({
      backend,
      readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
      mergeImportedSnapshot: (current, imported) => ({
        ...(current ?? imported),
        ...imported,
        workspace: {
          ...imported.workspace,
          name: `${current?.workspace.name ?? 'current'} + ${imported.workspace.name}`,
        },
      }),
    })

    const imported = createWorkspaceSnapshotFromStores({
      workspaceId: 'ws-import',
      workspaceName: 'Imported Workspace',
      exportedAt: '2026-03-11T12:00:00.000Z',
    })
    assertValidWorkspaceSnapshot(imported)

    const replaced = await coordinator.importWorkspaceSnapshot(imported, { mode: 'replace' })
    expect(replaced.workspace.name).toBe('Imported Workspace')

    const merged = await coordinator.importWorkspaceSnapshot(
      {
        ...imported,
        workspace: {
          ...imported.workspace,
          name: 'Merged Workspace',
        },
      },
      { mode: 'merge' },
    )
    expect(merged.workspace.name).toBe('Imported Workspace + Merged Workspace')
  })

  it('surfaces coordinator errors for invalid imports and failing backends', async () => {
    const coordinator = createPersistenceCoordinator({
      backend: {
        kind: 'memory',
        loadWorkspaceSnapshot: () => {
          throw new Error('load failed')
        },
        saveWorkspaceSnapshot: () => undefined,
      },
      readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
    })

    await expect(coordinator.bootstrap('broken')).rejects.toThrow('load failed')
    expect(coordinator.getStatus().phase).toBe('error')
    expect(coordinator.getStatus().lastError).toBe('load failed')

    const mergeCoordinator = createPersistenceCoordinator({
      backend: createInMemoryPersistenceBackend(),
      readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
    })

    const imported = createWorkspaceSnapshotFromStores({
      workspaceId: 'ws-import',
      exportedAt: '2026-03-11T12:00:00.000Z',
    })

    let saveCalls = 0
    const validationCoordinator = createPersistenceCoordinator({
      backend: {
        kind: 'memory',
        loadWorkspaceSnapshot: () => null,
        saveWorkspaceSnapshot: () => {
          saveCalls += 1
        },
      },
      readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
    })

    await expect(
      validationCoordinator.importWorkspaceSnapshot(
        {
          ...imported,
          snapshotVersion: 999 as 1,
        },
        { mode: 'replace' },
      ),
    ).rejects.toThrow(/expected 1, got 999/)
    expect(saveCalls).toBe(0)

    await expect(
      mergeCoordinator.importWorkspaceSnapshot(
        imported,
        { mode: 'merge' },
      ),
    ).rejects.toThrow(/Merge import requires mergeImportedSnapshot/)
  })

  it('bootstraps empty backends without claiming hydration', async () => {
    const coordinator = createPersistenceCoordinator({
      backend: createInMemoryPersistenceBackend(),
      readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
    })

    const result = await coordinator.bootstrap('empty-workspace')
    expect(result.snapshot).toBeNull()
    expect(result.status.phase).toBe('ready')
    expect(result.status.lastHydratedAt).toBeNull()
  })

  it('validates workspace snapshot edge cases directly', () => {
    expect(() => assertValidWorkspaceSnapshot(null)).toThrow(/must be an object/)
    expect(() => assertValidWorkspaceSnapshot([])).toThrow(/must be an object/)
    expect(() =>
      assertValidWorkspaceSnapshot({
        snapshotVersion: 1,
        workspace: { id: 42 },
        artifacts: {},
      }),
    ).toThrow(/workspace.id string/)
    expect(() =>
      assertValidWorkspaceSnapshot({
        snapshotVersion: 1,
      }),
    ).toThrow(/workspace.id string/)
    expect(() =>
      assertValidWorkspaceSnapshot({
        snapshotVersion: 1,
        workspace: { id: 'ws-1' },
      }),
    ).toThrow(/must include artifacts/)

    const valid = createWorkspaceSnapshotFromStores({
      workspaceId: 'ws-1',
      exportedAt: '2026-03-11T12:00:00.000Z',
    })

    expect(() =>
      assertValidWorkspaceSnapshot({
        ...valid,
        artifacts: {
          ...valid.artifacts,
          resume: undefined,
        },
      }),
    ).toThrow(/artifacts.resume/)
    expect(() =>
      assertValidWorkspaceSnapshot({
        ...valid,
        artifacts: {
          ...valid.artifacts,
          resume: {
            ...valid.artifacts.resume,
            artifactType: 'pipeline',
          },
        },
      }),
    ).toThrow(/mismatched artifacts.resume.artifactType/)
    expect(() =>
      assertValidWorkspaceSnapshot({
        ...valid,
        artifacts: {
          ...valid.artifacts,
          resume: {
            ...valid.artifacts.resume,
            payload: undefined,
          },
        },
      }),
    ).toThrow(/missing artifacts.resume.payload/)
  })

  it('loads missing workspaces as null while leaving the coordinator ready', async () => {
    const coordinator = createPersistenceCoordinator({
      backend: createInMemoryPersistenceBackend(),
      readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
    })

    const loaded = await coordinator.loadWorkspace('missing-workspace')
    expect(loaded).toBeNull()
    expect(coordinator.getStatus().phase).toBe('ready')
  })

  it('surfaces loadWorkspace backend failures as error status', async () => {
    const coordinator = createPersistenceCoordinator({
      backend: {
        kind: 'memory',
        loadWorkspaceSnapshot: () => {
          throw new Error('load failed')
        },
        saveWorkspaceSnapshot: () => undefined,
      },
      readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
    })

    await expect(coordinator.loadWorkspace('broken-workspace')).rejects.toThrow('load failed')
    expect(coordinator.getStatus().phase).toBe('error')
    expect(coordinator.getStatus().lastError).toBe('load failed')
  })

  it('surfaces save and import backend write failures as error status', async () => {
    const failingBackend = {
      kind: 'memory' as const,
      loadWorkspaceSnapshot: () => null,
      saveWorkspaceSnapshot: () => {
        throw new Error('save failed')
      },
    }

    const coordinator = createPersistenceCoordinator({
      backend: failingBackend,
      readWorkspaceSnapshot: createWorkspaceSnapshotFromStores,
    })

    await expect(
      coordinator.saveWorkspacePatch('broken-save', {
        workspace: {
          name: 'Broken',
        },
      }),
    ).rejects.toThrow('save failed')
    expect(coordinator.getStatus().phase).toBe('error')
    expect(coordinator.getStatus().lastError).toBe('save failed')

    const imported = createWorkspaceSnapshotFromStores({
      workspaceId: 'broken-import',
      exportedAt: '2026-03-11T12:00:00.000Z',
    })

    await expect(
      coordinator.importWorkspaceSnapshot(imported, { mode: 'replace' }),
    ).rejects.toThrow('save failed')
    expect(coordinator.getStatus().phase).toBe('error')
    expect(coordinator.getStatus().lastError).toBe('save failed')
  })
})
