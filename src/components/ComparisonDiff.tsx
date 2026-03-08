import type { AssemblyResult } from '../types'

interface ComparisonDiffProps {
  leftResult: AssemblyResult
  rightResult: AssemblyResult
  leftLabel: string
  rightLabel: string
}

interface DiffItem {
  id: string
  label: string
  status: 'both' | 'left-only' | 'right-only'
}

function collectComponentIds(result: AssemblyResult): Map<string, string> {
  const ids = new Map<string, string>()
  const resume = result.resume

  if (resume.targetLine) ids.set(resume.targetLine.id, 'Target Line')
  if (resume.profile) ids.set(resume.profile.id, 'Profile')

  for (const sg of resume.skillGroups) {
    ids.set(sg.id, sg.label)
  }

  for (const role of resume.roles) {
    for (const bullet of role.bullets) {
      ids.set(bullet.id, `${role.company}: ${bullet.text.slice(0, 50)}`)
    }
  }

  for (const project of resume.projects) {
    ids.set(project.id, project.name)
  }

  return ids
}

export function ComparisonDiff({ leftResult, rightResult, leftLabel, rightLabel }: ComparisonDiffProps) {
  const leftIds = collectComponentIds(leftResult)
  const rightIds = collectComponentIds(rightResult)

  const items: DiffItem[] = []

  for (const [id, label] of leftIds) {
    items.push({
      id,
      label,
      status: rightIds.has(id) ? 'both' : 'left-only',
    })
  }

  for (const [id, label] of rightIds) {
    if (!leftIds.has(id)) {
      items.push({ id, label, status: 'right-only' })
    }
  }

  const leftOnly = items.filter((i) => i.status === 'left-only')
  const rightOnly = items.filter((i) => i.status === 'right-only')

  if (leftOnly.length === 0 && rightOnly.length === 0) {
    return (
      <div className="comparison-diff">
        <p className="comparison-diff-empty">Both vectors include the same components.</p>
      </div>
    )
  }

  return (
    <div className="comparison-diff">
      {leftOnly.length > 0 && (
        <div className="comparison-diff-group">
          <span className="comparison-diff-badge left-only">Only in {leftLabel}</span>
          <ul className="comparison-diff-list">
            {leftOnly.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </div>
      )}
      {rightOnly.length > 0 && (
        <div className="comparison-diff-group">
          <span className="comparison-diff-badge right-only">Only in {rightLabel}</span>
          <ul className="comparison-diff-list">
            {rightOnly.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
