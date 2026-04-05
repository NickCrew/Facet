import type { DebriefPatternSignal, DebriefPatternSummary, DebriefSession } from '../types/debrief'

const summarize = (signals: DebriefPatternSignal[]): DebriefPatternSummary['anchorStories'] => {
  const byId = new Map<string, DebriefPatternSummary['anchorStories'][number]>()

  for (const signal of signals) {
    const key = signal.id.trim().toLowerCase() || signal.label.trim().toLowerCase()
    if (!key) continue

    const existing = byId.get(key)
    if (existing) {
      existing.count += 1
      continue
    }

    byId.set(key, {
      ...signal,
      count: 1,
    })
  }

  return [...byId.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count
    }
    return left.label.localeCompare(right.label)
  })
}

export const summarizeDebriefPatterns = (
  sessions: DebriefSession[],
): DebriefPatternSummary => ({
  anchorStories: summarize(sessions.flatMap((session) => session.anchorStories)).slice(0, 6),
  recurringGaps: summarize(sessions.flatMap((session) => session.recurringGaps)).slice(0, 6),
  bestFitCompanyTypes: summarize(
    sessions.flatMap((session) => session.bestFitCompanyTypes),
  ).slice(0, 6),
})

