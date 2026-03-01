import {
  DEFAULT_TARGET_PAGES,
  PRIORITY_ORDER,
  type AssembledRoleBullet,
  type AssembledTextComponent,
  type AssemblyOptions,
  type AssemblyResult,
  type ComponentPriority,
  type IncludedPriority,
  type ManualComponentOverrides,
  type ManualVariantOverrides,
  type PriorityByVector,
  type ResumeData,
  type TextVariantMap,
  type VariantSelection,
  type VectorSelection,
} from '../types'
import { applyPageBudget } from './pageBudget'

const PRIORITY_RANK: Record<IncludedPriority, number> = {
  must: 0,
  strong: 1,
  optional: 2,
}

const hasOwn = (record: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key)

const priorityRankForSorting = (priority: IncludedPriority): number => PRIORITY_RANK[priority]

const toIncludedPriority = (priority: ComponentPriority | null): IncludedPriority | null => {
  if (!priority || priority === 'exclude') {
    return null
  }

  return priority
}

const resolvePriorityForVector = (
  priorities: PriorityByVector,
  selectedVector: VectorSelection,
): ComponentPriority | null => {
  if (selectedVector === 'all') {
    for (const priority of PRIORITY_ORDER) {
      if (Object.values(priorities).includes(priority)) {
        return priority
      }
    }

    return null
  }

  return priorities[selectedVector] ?? null
}

export const getPriorityForVector = (
  priorities: PriorityByVector,
  selectedVector: VectorSelection,
): ComponentPriority => resolvePriorityForVector(priorities, selectedVector) ?? 'exclude'

const resolveTextVariant = (
  keys: string[],
  text: string,
  variants: TextVariantMap | undefined,
  variantOverrides: ManualVariantOverrides,
  selectedVector: VectorSelection,
): string => {
  const variantOverride = resolveVariantOverride(variantOverrides, keys)
  if (variantOverride === 'default') {
    return text
  }

  if (variantOverride && variants?.[variantOverride]) {
    return variants[variantOverride]
  }

  if (selectedVector !== 'all' && variants?.[selectedVector]) {
    return variants[selectedVector]
  }

  return text
}

export const buildComponentKeys = (type: string, id: string, roleId?: string): string[] => {
  const keys = [`${type}:${id}`, id]

  if (roleId) {
    keys.unshift(`role:${roleId}:${type}:${id}`, `role:${roleId}:${id}`)
  }

  return keys
}

const resolveManualOverride = (
  overrides: ManualComponentOverrides,
  keys: string[],
): boolean | undefined => {
  for (const key of keys) {
    if (hasOwn(overrides, key)) {
      return overrides[key]
    }
  }

  return undefined
}

const resolveVariantOverride = (
  overrides: ManualVariantOverrides,
  keys: string[],
): VariantSelection | undefined => {
  for (const key of keys) {
    if (hasOwn(overrides, key)) {
      return overrides[key]
    }
  }

  return undefined
}

const shouldIncludeComponent = (
  rawPriority: ComponentPriority | null,
  override: boolean | undefined,
): boolean => {
  if (override === false) {
    return false
  }

  if (override === true) {
    return true
  }

  const includedPriority = toIncludedPriority(rawPriority)
  return includedPriority !== null
}

const normalizeIncludedPriority = (
  rawPriority: ComponentPriority | null,
  override: boolean | undefined,
): IncludedPriority => {
  const includedPriority = toIncludedPriority(rawPriority)

  if (includedPriority) {
    return includedPriority
  }

  // Manually forced inclusion of excluded/unknown-priority components defaults to optional.
  void override
  return 'optional'
}

const applyManualBulletOrder = (
  bullets: AssembledRoleBullet[],
  roleOrder: string[] | undefined,
): AssembledRoleBullet[] => {
  if (!roleOrder || roleOrder.length === 0) {
    return bullets
  }

  const orderIndex = new Map<string, number>()
  for (const [index, id] of roleOrder.entries()) {
    orderIndex.set(id, index)
  }

  const fallbackIndex = new Map<string, number>()
  for (const [index, bullet] of bullets.entries()) {
    fallbackIndex.set(bullet.id, index)
  }

  return [...bullets].sort((left, right) => {
    const leftOrder = orderIndex.get(left.id)
    const rightOrder = orderIndex.get(right.id)

    if (leftOrder !== undefined && rightOrder !== undefined) {
      return leftOrder - rightOrder
    }

    if (leftOrder !== undefined) {
      return -1
    }

    if (rightOrder !== undefined) {
      return 1
    }

    return (fallbackIndex.get(left.id) ?? 0) - (fallbackIndex.get(right.id) ?? 0)
  })
}

interface RankedTextComponent {
  component: AssembledTextComponent
  sourceIndex: number
}

const pickHighestPriorityText = (
  candidates: RankedTextComponent[],
): AssembledTextComponent | undefined => {
  if (candidates.length === 0) {
    return undefined
  }

  return [...candidates]
    .sort((left, right) => {
      const priorityDelta =
        priorityRankForSorting(left.component.priority) - priorityRankForSorting(right.component.priority)
      if (priorityDelta !== 0) {
        return priorityDelta
      }

      return left.sourceIndex - right.sourceIndex
    })
    .at(0)?.component
}

const skillGroupSortOrder = (
  order: Record<string, number | undefined>,
  selectedVector: VectorSelection,
): number => {
  if (selectedVector !== 'all') {
    const byVector = order[selectedVector]
    if (typeof byVector === 'number') {
      return byVector
    }
  }

  const defaultOrder = order.default
  return typeof defaultOrder === 'number' ? defaultOrder : Number.MAX_SAFE_INTEGER
}

interface ResolvedSkillGroupConfig {
  include: boolean
  order: number
  content: string
}

const resolveSkillGroupConfig = (
  group: ResumeData['skill_groups'][number],
  selectedVector: VectorSelection,
): ResolvedSkillGroupConfig => {
  const vectorConfigs = group.vectors ?? {}

  if (selectedVector === 'all') {
    const includedConfigs = Object.values(vectorConfigs).filter((config) => config.priority !== 'exclude')
    if (includedConfigs.length > 0) {
      const minOrder = Math.min(...includedConfigs.map((config) => config.order))
      return {
        include: true,
        order: Number.isFinite(minOrder) ? minOrder : Number.MAX_SAFE_INTEGER,
        content: group.content,
      }
    }

    return {
      include: true,
      order: skillGroupSortOrder(group.order ?? {}, 'all'),
      content: group.content,
    }
  }

  const explicitConfig = vectorConfigs[selectedVector]
  if (explicitConfig) {
    return {
      include: explicitConfig.priority !== 'exclude',
      order: explicitConfig.order,
      content: explicitConfig.content ?? group.content,
    }
  }

  return {
    include: true,
    order: skillGroupSortOrder(group.order ?? {}, selectedVector),
    content: group.content,
  }
}

export const assembleResume = (
  data: ResumeData,
  options: AssemblyOptions = {},
): AssemblyResult => {
  const selectedVector = options.selectedVector ?? 'all'
  const manualOverrides = options.manualOverrides ?? {}
  const variantOverrides = options.variantOverrides ?? {}
  const bulletOrderByRole = options.bulletOrderByRole ?? {}
  const targetPages = options.targetPages ?? DEFAULT_TARGET_PAGES
  const trimToPageBudget = options.trimToPageBudget ?? true

  const targetLineCandidates: RankedTextComponent[] = []
  const profileCandidates: RankedTextComponent[] = []

  for (const [index, targetLine] of data.target_lines.entries()) {
    const keys = buildComponentKeys('target_line', targetLine.id)
    const autoPriority = resolvePriorityForVector(targetLine.vectors, selectedVector)
    const override = resolveManualOverride(manualOverrides, keys)
    if (!shouldIncludeComponent(autoPriority, override)) {
      continue
    }

    targetLineCandidates.push({
      component: {
        id: targetLine.id,
        text: resolveTextVariant(
          keys,
          targetLine.text,
          targetLine.variants,
          variantOverrides,
          selectedVector,
        ),
        priority: normalizeIncludedPriority(autoPriority, override),
      },
      sourceIndex: index,
    })
  }

  for (const [index, profile] of data.profiles.entries()) {
    const keys = buildComponentKeys('profile', profile.id)
    const autoPriority = resolvePriorityForVector(profile.vectors, selectedVector)
    const override = resolveManualOverride(manualOverrides, keys)
    if (!shouldIncludeComponent(autoPriority, override)) {
      continue
    }

    profileCandidates.push({
      component: {
        id: profile.id,
        text: resolveTextVariant(keys, profile.text, profile.variants, variantOverrides, selectedVector),
        priority: normalizeIncludedPriority(autoPriority, override),
      },
      sourceIndex: index,
    })
  }

  const skillGroups = data.skill_groups
    .map((group, index) => ({
      id: group.id,
      label: group.label,
      config: resolveSkillGroupConfig(group, selectedVector),
      sourceIndex: index,
    }))
    .filter((group) => group.config.include)
    .sort((left, right) => {
      const orderDelta = left.config.order - right.config.order
      if (orderDelta !== 0) {
        return orderDelta
      }

      return left.sourceIndex - right.sourceIndex
    })
    .map(({ id, label, config }) => ({ id, label, content: config.content }))

  const roles = data.roles
    .map((role) => {
      const roleOverride = resolveManualOverride(manualOverrides, buildComponentKeys('role', role.id))
      if (roleOverride === false) {
        return null
      }

      const includedBullets = role.bullets
        .map((bullet, bulletIndex) => {
          const keys = buildComponentKeys('bullet', bullet.id, role.id)
          const autoPriority = resolvePriorityForVector(bullet.vectors, selectedVector)
          const override = resolveManualOverride(manualOverrides, keys)

          if (!shouldIncludeComponent(autoPriority, override)) {
            return null
          }

          return {
            id: bullet.id,
            text: resolveTextVariant(keys, bullet.text, bullet.variants, variantOverrides, selectedVector),
            priority: normalizeIncludedPriority(autoPriority, override),
            sourceIndex: bulletIndex,
          }
        })
        .filter((bullet): bullet is Exclude<typeof bullet, null> => bullet !== null)
        .sort((left, right) => {
          const priorityDelta =
            priorityRankForSorting(left.priority) - priorityRankForSorting(right.priority)
          if (priorityDelta !== 0) {
            return priorityDelta
          }

          return left.sourceIndex - right.sourceIndex
        })
        .map(({ id, text, priority }) => ({ id, text, priority }))

      const orderedBullets = applyManualBulletOrder(includedBullets, bulletOrderByRole[role.id])
      if (orderedBullets.length === 0) {
        return null
      }

      return {
        id: role.id,
        company: role.company,
        title: role.title,
        dates: role.dates,
        subtitle: role.subtitle,
        bullets: orderedBullets,
      }
    })
    .filter((role): role is Exclude<typeof role, null> => role !== null)

  const projects = data.projects
    .map((project) => {
      const keys = buildComponentKeys('project', project.id)
      const autoPriority = resolvePriorityForVector(project.vectors, selectedVector)
      const override = resolveManualOverride(manualOverrides, keys)
      if (!shouldIncludeComponent(autoPriority, override)) {
        return null
      }

      return {
        id: project.id,
        name: project.name,
        url: project.url,
        text: resolveTextVariant(keys, project.text, project.variants, variantOverrides, selectedVector),
        priority: normalizeIncludedPriority(autoPriority, override),
      }
    })
    .filter((project): project is Exclude<typeof project, null> => project !== null)

  const assembled = {
    selectedVector,
    header: data.meta,
    targetLine: pickHighestPriorityText(targetLineCandidates),
    profile: pickHighestPriorityText(profileCandidates),
    skillGroups,
    roles,
    projects,
    education: data.education,
  }

  const budgeted = applyPageBudget(assembled, {
    targetPages,
    trim: trimToPageBudget,
  })

  return {
    resume: budgeted.resume,
    targetPages: budgeted.targetPages,
    estimatedPages: budgeted.estimatedPages,
    estimatedPageUsage: budgeted.estimatedPageUsage,
    mustOnlyEstimatedPages: budgeted.mustOnlyEstimatedPages,
    mustOnlyEstimatedPageUsage: budgeted.mustOnlyEstimatedPageUsage,
    trimmedBulletIds: budgeted.trimmedBulletIds,
    warnings: budgeted.warnings,
  }
}
