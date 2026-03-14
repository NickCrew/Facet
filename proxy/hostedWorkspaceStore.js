import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const FACET_WORKSPACE_SNAPSHOT_VERSION = 1
const FACET_ARTIFACT_TYPES = ['resume', 'pipeline', 'prep', 'coverLetters', 'research']

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneValue(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

function createWorkspaceValidationError(message) {
  const error = new Error(message)
  error.name = 'WorkspaceStoreValidationError'
  return error
}

function membershipKey(tenantId, workspaceId) {
  return `${tenantId}:${workspaceId}`
}

function normalizeWorkspaceMembership(value) {
  if (!isRecord(value)) {
    return null
  }

  const workspaceId = typeof value.workspaceId === 'string' ? value.workspaceId.trim() : ''
  const role = value.role === 'owner' ? 'owner' : null
  if (!workspaceId || !role) {
    return null
  }

  return {
    workspaceId,
    role,
    isDefault: value.isDefault === true,
  }
}

function normalizeHostedActorRecord(value) {
  if (!isRecord(value)) {
    return null
  }

  const tenantId = typeof value.tenantId === 'string' ? value.tenantId.trim() : ''
  const accountId = typeof value.accountId === 'string' ? value.accountId.trim() : ''
  const userId = typeof value.userId === 'string' ? value.userId.trim() : ''
  const email = typeof value.email === 'string' ? value.email.trim().toLowerCase() : ''
  const workspaces = Array.isArray(value.workspaces)
    ? value.workspaces.map(normalizeWorkspaceMembership).filter(Boolean)
    : []

  if (!tenantId || !accountId || !userId || !email) {
    return null
  }

  return {
    tenantId,
    accountId,
    userId,
    email,
    workspaces,
  }
}

function normalizeWorkspaceRecord(value) {
  if (!isRecord(value)) {
    return null
  }

  const tenantId = typeof value.tenantId === 'string' ? value.tenantId.trim() : ''
  const accountId = typeof value.accountId === 'string' ? value.accountId.trim() : ''
  const workspaceId = typeof value.workspaceId === 'string' ? value.workspaceId.trim() : ''
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const revision =
    typeof value.revision === 'number' && Number.isFinite(value.revision)
      ? value.revision
      : null
  const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : ''
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : updatedAt

  if (!tenantId || !accountId || !workspaceId || !name || revision == null || !updatedAt || !createdAt) {
    return null
  }

  return {
    tenantId,
    accountId,
    workspaceId,
    name,
    revision,
    updatedAt,
    createdAt,
  }
}

function normalizeHostedWorkspaceDirectory(value) {
  if (!isRecord(value)) {
    throw new Error('Hosted workspace file must be a JSON object.')
  }

  return {
    actors: Array.isArray(value.actors)
      ? value.actors.map(normalizeHostedActorRecord).filter(Boolean)
      : [],
    workspaces: Array.isArray(value.workspaces)
      ? value.workspaces.map(normalizeWorkspaceRecord).filter(Boolean)
      : [],
    snapshots: Array.isArray(value.snapshots)
      ? value.snapshots.filter((snapshot) => isRecord(snapshot))
      : [],
  }
}

function createEmptySnapshot(actor, workspaceId, workspaceName, timestamp) {
  const artifacts = Object.fromEntries(
    FACET_ARTIFACT_TYPES.map((artifactType) => {
      let payload

      switch (artifactType) {
        case 'resume':
          payload = {
            version: 1,
            meta: { name: '', email: '', phone: '', location: '', links: [] },
            target_lines: [],
            profiles: [],
            skill_groups: [],
            roles: [],
            projects: [],
            education: [],
            certifications: [],
            vectors: [],
            presets: [],
          }
          break
        case 'pipeline':
          payload = { entries: [] }
          break
        case 'prep':
          payload = { decks: [] }
          break
        case 'coverLetters':
          payload = { templates: [] }
          break
        case 'research':
          payload = { profile: null, requests: [], runs: [] }
          break
        default:
          payload = {}
      }

      return [
        artifactType,
        {
          artifactId: `${workspaceId}:${artifactType}`,
          artifactType,
          workspaceId,
          schemaVersion: 1,
          revision: 0,
          updatedAt: timestamp,
          payload,
        },
      ]
    }),
  )

  return {
    snapshotVersion: FACET_WORKSPACE_SNAPSHOT_VERSION,
    tenantId: actor.tenantId,
    userId: actor.userId,
    workspace: {
      id: workspaceId,
      name: workspaceName,
      revision: 0,
      updatedAt: timestamp,
    },
    artifacts,
    exportedAt: timestamp,
  }
}

function createWorkspaceSummary(record, membership) {
  return {
    workspaceId: record.workspaceId,
    name: record.name,
    revision: record.revision,
    updatedAt: record.updatedAt,
    role: membership.role,
    isDefault: membership.isDefault,
  }
}

function compareWorkspaceMemberships(left, right) {
  if (left.isDefault !== right.isDefault) {
    return left.isDefault ? -1 : 1
  }

  return left.workspaceId.localeCompare(right.workspaceId)
}

function ensureSingleDefault(memberships) {
  let defaultFound = false

  for (const membership of memberships) {
    if (!defaultFound && membership.isDefault) {
      defaultFound = true
      continue
    }

    if (defaultFound && membership.isDefault) {
      membership.isDefault = false
    }
  }

  if (!defaultFound && memberships.length > 0) {
    memberships[0].isDefault = true
  }
}

function buildStoreState(directory) {
  const actors = new Map(
    directory.actors.map((actor) => {
      const memberships = actor.workspaces
        .map((membership) => cloneValue(membership))
        .sort(compareWorkspaceMemberships)
      ensureSingleDefault(memberships)

      return [
        actor.userId,
        {
          tenantId: actor.tenantId,
          accountId: actor.accountId,
          userId: actor.userId,
          email: actor.email,
          workspaces: memberships,
        },
      ]
    }),
  )
  const workspaces = new Map(
    directory.workspaces.map((workspace) => [
      membershipKey(workspace.tenantId, workspace.workspaceId),
      cloneValue(workspace),
    ]),
  )
  const snapshots = new Map(
    directory.snapshots.flatMap((snapshot) => {
      const tenantId = typeof snapshot.tenantId === 'string' ? snapshot.tenantId : ''
      const workspaceId = typeof snapshot.workspace?.id === 'string' ? snapshot.workspace.id : ''
      return tenantId && workspaceId
        ? [[membershipKey(tenantId, workspaceId), cloneValue(snapshot)]]
        : []
    }),
  )

  return {
    actors,
    workspaces,
    snapshots,
  }
}

function serializeState(state) {
  return {
    actors: Array.from(state.actors.values()).map((actor) => ({
      tenantId: actor.tenantId,
      accountId: actor.accountId,
      userId: actor.userId,
      email: actor.email,
      workspaces: actor.workspaces.map((membership) => ({
        workspaceId: membership.workspaceId,
        role: membership.role,
        isDefault: membership.isDefault,
      })),
    })),
    workspaces: Array.from(state.workspaces.values()),
    snapshots: Array.from(state.snapshots.values()),
  }
}

function createWorkspaceStoreApi({ readState, writeState, persist }) {
  const getActorRecord = async (userId) => {
    const state = await readState()
    const actor = state.actors.get(userId)
    return actor ? cloneValue(actor) : null
  }

  const getWorkspaceRecord = async (tenantId, workspaceId) => {
    const state = await readState()
    return cloneValue(state.workspaces.get(membershipKey(tenantId, workspaceId)) ?? null)
  }

  const loadWorkspaceRecord = async (tenantId, workspaceId) => {
    const state = await readState()
    return cloneValue(state.snapshots.get(membershipKey(tenantId, workspaceId)) ?? null)
  }

  return {
    async getActor(userId) {
      const actor = await getActorRecord(userId)
      if (!actor) {
        return null
      }

      return {
        tenantId: actor.tenantId,
        accountId: actor.accountId,
        userId: actor.userId,
        email: actor.email,
        workspaces: actor.workspaces.map((membership) => cloneValue(membership)),
      }
    },

    async loadWorkspace(tenantId, workspaceId) {
      return loadWorkspaceRecord(tenantId, workspaceId)
    },

    async saveWorkspace(snapshot) {
      const actorUserId = typeof snapshot.userId === 'string' ? snapshot.userId : ''
      const actor = actorUserId ? await getActorRecord(actorUserId) : null
      if (!actor || actor.tenantId !== snapshot.tenantId) {
        throw createWorkspaceValidationError('Hosted workspace save requires a provisioned actor.')
      }

      const hasMembership = actor.workspaces.some(
        (membership) => membership.workspaceId === snapshot.workspace.id,
      )
      if (!hasMembership) {
        throw createWorkspaceValidationError('Hosted workspace save requires workspace membership.')
      }

      const key = membershipKey(actor.tenantId, snapshot.workspace.id)
      const currentRecord = await getWorkspaceRecord(actor.tenantId, snapshot.workspace.id)
      const nextRecord = {
        tenantId: actor.tenantId,
        accountId: actor.accountId,
        workspaceId: snapshot.workspace.id,
        name: snapshot.workspace.name,
        revision: snapshot.workspace.revision,
        updatedAt: snapshot.workspace.updatedAt,
        createdAt: currentRecord?.createdAt ?? snapshot.workspace.updatedAt,
      }

      await writeState((state) => {
        state.workspaces.set(key, cloneValue(nextRecord))
        state.snapshots.set(key, cloneValue(snapshot))
      })
      await persist()

      return cloneValue(snapshot)
    },

    async listWorkspacesForActor(actor) {
      const state = await readState()
      const actorRecord = state.actors.get(actor.userId)
      if (!actorRecord) {
        return []
      }

      return actorRecord.workspaces
        .map((membership) => {
          const workspace = state.workspaces.get(membershipKey(actor.tenantId, membership.workspaceId))
          return workspace ? createWorkspaceSummary(workspace, membership) : null
        })
        .filter(Boolean)
        .map((workspace) => cloneValue(workspace))
    },

    async createWorkspace(actor, input = {}, timestamp) {
      const actorRecord = await getActorRecord(actor.userId)
      if (!actorRecord) {
        throw createWorkspaceValidationError('Hosted actor is not provisioned for workspace creation.')
      }

      const trimmedName = typeof input.name === 'string' ? input.name.trim() : ''
      const workspaceName = trimmedName || 'Facet Workspace'
      const requestedWorkspaceId =
        typeof input.workspaceId === 'string' ? input.workspaceId.trim() : ''
      const workspaceId = requestedWorkspaceId || `workspace-${randomUUID()}`
      const key = membershipKey(actor.tenantId, workspaceId)
      const wasEmpty = actorRecord.workspaces.length === 0

      const workspace = {
        tenantId: actor.tenantId,
        accountId: actor.accountId,
        workspaceId,
        name: workspaceName,
        revision: 0,
        updatedAt: timestamp,
        createdAt: timestamp,
      }
      const membership = {
        workspaceId,
        role: 'owner',
        isDefault: wasEmpty || !actorRecord.workspaces.some((entry) => entry.isDefault),
      }
      const snapshot = createEmptySnapshot(actor, workspaceId, workspaceName, timestamp)

      await writeState((state) => {
        if (state.workspaces.has(key)) {
          throw createWorkspaceValidationError(`Hosted workspace "${workspaceId}" already exists.`)
        }

        const writableActor = state.actors.get(actor.userId)
        if (!writableActor) {
          throw createWorkspaceValidationError('Hosted actor is not provisioned for workspace creation.')
        }

        writableActor.workspaces.push(cloneValue(membership))
        writableActor.workspaces.sort(compareWorkspaceMemberships)
        ensureSingleDefault(writableActor.workspaces)

        state.workspaces.set(key, cloneValue(workspace))
        state.snapshots.set(key, cloneValue(snapshot))
      })
      await persist()

      return {
        workspace: createWorkspaceSummary(workspace, membership),
        snapshot,
      }
    },

    async renameWorkspace(actor, workspaceId, name, timestamp) {
      const trimmedName = typeof name === 'string' ? name.trim() : ''
      if (!trimmedName) {
        throw createWorkspaceValidationError('Hosted workspace name is required.')
      }

      const actorRecord = await getActorRecord(actor.userId)
      const membership = actorRecord?.workspaces.find((entry) => entry.workspaceId === workspaceId) ?? null
      if (!membership || membership.role !== 'owner') {
        throw createWorkspaceValidationError('Hosted workspace rename requires owner access.')
      }

      let renamedSummary = null
      let renamedSnapshot = null

      await writeState((state) => {
        const key = membershipKey(actor.tenantId, workspaceId)
        const workspace = state.workspaces.get(key)
        if (!workspace) {
          throw createWorkspaceValidationError('Hosted workspace not found.')
        }

        const nextRevision = workspace.revision + 1
        workspace.name = trimmedName
        workspace.revision = nextRevision
        workspace.updatedAt = timestamp
        renamedSummary = createWorkspaceSummary(workspace, membership)

        const snapshot = state.snapshots.get(key)
        if (snapshot && isRecord(snapshot.workspace)) {
          snapshot.workspace = {
            ...snapshot.workspace,
            name: trimmedName,
            revision: nextRevision,
            updatedAt: timestamp,
          }
          snapshot.exportedAt = timestamp
          renamedSnapshot = cloneValue(snapshot)
        }
      })
      await persist()

      return {
        workspace: cloneValue(renamedSummary),
        snapshot: cloneValue(renamedSnapshot),
      }
    },

    async deleteWorkspace(actor, workspaceId) {
      const actorRecord = await getActorRecord(actor.userId)
      const membership = actorRecord?.workspaces.find((entry) => entry.workspaceId === workspaceId) ?? null
      if (!membership || membership.role !== 'owner') {
        throw createWorkspaceValidationError('Hosted workspace deletion requires owner access.')
      }

      let nextDefaultWorkspaceId = null

      await writeState((state) => {
        const key = membershipKey(actor.tenantId, workspaceId)
        if (!state.workspaces.has(key)) {
          throw createWorkspaceValidationError('Hosted workspace not found.')
        }

        const writableActor = state.actors.get(actor.userId)
        if (!writableActor) {
          throw createWorkspaceValidationError('Hosted actor is not provisioned for workspace deletion.')
        }

        writableActor.workspaces = writableActor.workspaces.filter((entry) => entry.workspaceId !== workspaceId)
        writableActor.workspaces.sort(compareWorkspaceMemberships)
        ensureSingleDefault(writableActor.workspaces)
        nextDefaultWorkspaceId =
          writableActor.workspaces.find((entry) => entry.isDefault)?.workspaceId ??
          writableActor.workspaces[0]?.workspaceId ??
          null

        state.workspaces.delete(key)
        state.snapshots.delete(key)
      })
      await persist()

      return {
        deletedWorkspaceId: workspaceId,
        defaultWorkspaceId: nextDefaultWorkspaceId,
      }
    },
  }
}

export function createInMemoryHostedWorkspaceStore(directory = {}) {
  let state = buildStoreState(normalizeHostedWorkspaceDirectory(directory))

  return createWorkspaceStoreApi({
    readState: async () => state,
    writeState: async (mutate) => {
      const next = buildStoreState(serializeState(state))
      mutate(next)
      state = next
    },
    persist: async () => {},
  })
}

export function createFileHostedWorkspaceStore(filePath) {
  if (!filePath) {
    throw new Error('Hosted persistence requires HOSTED_WORKSPACE_FILE.')
  }

  let cachedState = null

  const readState = async () => {
    if (cachedState) {
      return cachedState
    }

    const raw = await readFile(filePath, 'utf8')
    cachedState = buildStoreState(normalizeHostedWorkspaceDirectory(JSON.parse(raw)))
    return cachedState
  }

  const persist = async () => {
    if (!cachedState) {
      return
    }

    await writeFile(filePath, JSON.stringify(serializeState(cachedState), null, 2))
  }

  return createWorkspaceStoreApi({
    readState,
    writeState: async (mutate) => {
      const current = await readState()
      const next = buildStoreState(serializeState(current))
      mutate(next)
      cachedState = next
    },
    persist,
  })
}
