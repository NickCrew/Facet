import { FACET_WORKSPACE_SNAPSHOT_VERSION } from './contracts'
import type { FacetWorkspaceSnapshot } from './contracts'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function assertValidWorkspaceSnapshot(
  snapshot: unknown,
): asserts snapshot is FacetWorkspaceSnapshot {
  if (!isRecord(snapshot)) {
    throw new Error('Workspace snapshot must be an object.')
  }

  if (snapshot.snapshotVersion !== FACET_WORKSPACE_SNAPSHOT_VERSION) {
    throw new Error(
      `Unsupported workspace snapshot version: expected ${FACET_WORKSPACE_SNAPSHOT_VERSION}, got ${String(snapshot.snapshotVersion)}`,
    )
  }

  if (!isRecord(snapshot.workspace) || typeof snapshot.workspace.id !== 'string') {
    throw new Error('Workspace snapshot must include a workspace.id string.')
  }

  if (!isRecord(snapshot.artifacts)) {
    throw new Error('Workspace snapshot must include artifacts.')
  }

  for (const key of ['resume', 'pipeline', 'prep', 'coverLetters', 'research'] as const) {
    const artifact = snapshot.artifacts[key]

    if (!isRecord(artifact)) {
      throw new Error(`Workspace snapshot is missing artifacts.${key}.`)
    }

    if (artifact.artifactType !== key) {
      throw new Error(`Workspace snapshot has mismatched artifacts.${key}.artifactType.`)
    }

    if (!('payload' in artifact) || artifact.payload == null) {
      throw new Error(`Workspace snapshot is missing artifacts.${key}.payload.`)
    }
  }
}
