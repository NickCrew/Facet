import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { importProfessionalIdentity, type ProfessionalIdentityV3 } from '../identity/schema'
import type {
  IdentityApplyMode,
  IdentityApplyResult,
  IdentityChangeLogEntry,
  IdentityExtractionDraft,
} from '../types/identity'
import { createId } from '../utils/idUtils'
import { parseJsonWithRepair } from '../utils/jsonParsing'
import { mergeProfessionalIdentity, replaceProfessionalIdentity } from '../utils/identityMerge'
import { resolveStorage } from './storage'

interface IdentityState {
  sourceMaterial: string
  correctionNotes: string
  currentIdentity: ProfessionalIdentityV3 | null
  draft: IdentityExtractionDraft | null
  draftDocument: string
  warnings: string[]
  changelog: IdentityChangeLogEntry[]
  lastError: string | null
  setSourceMaterial: (value: string) => void
  setCorrectionNotes: (value: string) => void
  setDraft: (draft: IdentityExtractionDraft) => void
  setDraftDocument: (value: string) => void
  clearDraft: () => void
  clearLastError: () => void
  importIdentity: (value: unknown, summary?: string) => IdentityApplyResult
  applyDraft: (mode: IdentityApplyMode) => IdentityApplyResult
}

const formatIdentityDocument = (identity: ProfessionalIdentityV3): string =>
  JSON.stringify(identity, null, 2)

const createChangeLogEntry = ({
  action,
  summary,
  details,
  mode,
}: {
  action: IdentityChangeLogEntry['action']
  summary: string
  details: string[]
  mode?: IdentityApplyMode
}): IdentityChangeLogEntry => ({
  id: createId('identity-log'),
  createdAt: new Date().toISOString(),
  action,
  summary,
  details,
  ...(mode ? { mode } : {}),
})

const appendChangelog = (
  current: IdentityChangeLogEntry[],
  entry: IdentityChangeLogEntry,
): IdentityChangeLogEntry[] => [entry, ...current].slice(0, 25)

const parseDraftDocument = (value: string): { data: ProfessionalIdentityV3; warnings: string[] } => {
  const parsed = parseJsonWithRepair<unknown>(value, 'Draft identity document')
  const imported = importProfessionalIdentity(parsed.data)
  return {
    data: imported.data,
    warnings: parsed.repaired
      ? ['Repaired minor JSON syntax issues in the draft document before validation.', ...imported.warnings]
      : imported.warnings,
  }
}

export const useIdentityStore = create<IdentityState>()(
  persist(
    (set, get) => ({
      sourceMaterial: '',
      correctionNotes: '',
      currentIdentity: null,
      draft: null,
      draftDocument: '',
      warnings: [],
      changelog: [],
      lastError: null,
      setSourceMaterial: (value) => set({ sourceMaterial: value }),
      setCorrectionNotes: (value) => set({ correctionNotes: value }),
      setDraft: (draft) =>
        set((state) => ({
          draft,
          draftDocument: formatIdentityDocument(draft.identity),
          warnings: draft.warnings,
          lastError: null,
          changelog: appendChangelog(
            state.changelog,
            createChangeLogEntry({
              action: 'draft-generated',
              summary: `Generated extraction draft with ${draft.identity.roles.length} roles.`,
              details: [
                draft.summary,
                ...(draft.followUpQuestions.length > 0
                  ? [`Follow-up questions: ${draft.followUpQuestions.join(' | ')}`]
                  : []),
              ],
            }),
          ),
        })),
      setDraftDocument: (value) => set({ draftDocument: value }),
      clearDraft: () => set({ draft: null, draftDocument: '', lastError: null }),
      clearLastError: () => set({ lastError: null }),
      importIdentity: (value, summary = 'Imported identity model') => {
        const imported = importProfessionalIdentity(value)
        const result: IdentityApplyResult = {
          data: imported.data,
          warnings: imported.warnings,
          summary,
          details: ['Loaded identity.json into the Phase 0 workspace.'],
        }

        set((state) => ({
          draft: null,
          currentIdentity: result.data,
          warnings: result.warnings,
          draftDocument: formatIdentityDocument(result.data),
          lastError: null,
          changelog: appendChangelog(
            state.changelog,
            createChangeLogEntry({
              action: 'identity-imported',
              summary: result.summary,
              details: result.details,
            }),
          ),
        }))

        return result
      },
      applyDraft: (mode) => {
        const { currentIdentity, draftDocument } = get()
        const parsedDraft = parseDraftDocument(draftDocument)
        const result =
          mode === 'merge' && currentIdentity
            ? mergeProfessionalIdentity(currentIdentity, parsedDraft.data)
            : replaceProfessionalIdentity(parsedDraft.data)

        set((state) => ({
          currentIdentity: result.data,
          warnings: result.warnings,
          draftDocument: formatIdentityDocument(result.data),
          lastError: null,
          changelog: appendChangelog(
            state.changelog,
            createChangeLogEntry({
              action: 'draft-applied',
              mode,
              summary: result.summary,
              details: result.details,
            }),
          ),
        }))

        return result
      },
    }),
    {
      name: 'facet-identity-workspace',
      version: 1,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        sourceMaterial: state.sourceMaterial,
        correctionNotes: state.correctionNotes,
        currentIdentity: state.currentIdentity,
        draft: state.draft,
        draftDocument: state.draftDocument,
        warnings: state.warnings,
        changelog: state.changelog,
      }),
    },
  ),
)
