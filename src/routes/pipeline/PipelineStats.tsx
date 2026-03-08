import { useMemo } from 'react'
import type { PipelineEntry } from '../../types/pipeline'

interface PipelineStatsProps {
  entries: PipelineEntry[]
}

const RESPONDED_STATUSES = new Set([
  'screening', 'interviewing', 'offer', 'accepted', 'rejected', 'closed',
])

export function PipelineStats({ entries }: PipelineStatsProps) {
  const stats = useMemo(() => {
    const total = entries.length
    const applied = entries.filter((e) => e.status !== 'researching').length
    const responded = entries.filter((e) => RESPONDED_STATUSES.has(e.status)).length
    const interviewing = entries.filter((e) =>
      e.status === 'screening' || e.status === 'interviewing'
    ).length
    const offers = entries.filter((e) =>
      e.status === 'offer' || e.status === 'accepted'
    ).length
    return { total, applied, responded, interviewing, offers }
  }, [entries])

  return (
    <div className="pipeline-stats">
      <div className="pipeline-stat">
        <span className="pipeline-stat-value">{stats.total}</span>
        <span className="pipeline-stat-label">Targets</span>
      </div>
      <div className="pipeline-stat">
        <span className="pipeline-stat-value">{stats.applied}</span>
        <span className="pipeline-stat-label">Applied</span>
      </div>
      <div className="pipeline-stat">
        <span className="pipeline-stat-value">{stats.responded}</span>
        <span className="pipeline-stat-label">Responded</span>
      </div>
      <div className="pipeline-stat">
        <span className="pipeline-stat-value">{stats.interviewing}</span>
        <span className="pipeline-stat-label">Interviewing</span>
      </div>
      <div className="pipeline-stat">
        <span className="pipeline-stat-value">{stats.offers}</span>
        <span className="pipeline-stat-label">Offers</span>
      </div>
    </div>
  )
}
