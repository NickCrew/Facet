import { Search } from 'lucide-react'
import type { PipelineStatus, PipelineTier } from '../../types/pipeline'

export interface PipelineFilterState {
  tiers: PipelineTier[]
  statuses: PipelineStatus[]
  search: string
}

interface PipelineFiltersProps {
  filters: PipelineFilterState
  onFilterChange: (filters: PipelineFilterState) => void
}

const TIERS: { value: PipelineTier; label: string }[] = [
  { value: '1', label: 'T1' },
  { value: '2', label: 'T2' },
  { value: '3', label: 'T3' },
  { value: 'watch', label: 'Watch' },
]

const STATUSES: { value: PipelineStatus; label: string }[] = [
  { value: 'researching', label: 'Researching' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'closed', label: 'Closed' },
]

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item]
}

export function PipelineFilters({ filters, onFilterChange }: PipelineFiltersProps) {
  return (
    <div className="pipeline-filters">
      <div className="pipeline-filter-group">
        <span className="pipeline-filter-group-label">Tier</span>
        {TIERS.map((t) => (
          <button
            key={t.value}
            className={`pipeline-pill ${filters.tiers.includes(t.value) ? 'pipeline-pill-active' : ''}`}
            aria-pressed={filters.tiers.includes(t.value)}
            onClick={() =>
              onFilterChange({ ...filters, tiers: toggleItem(filters.tiers, t.value) })
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pipeline-filter-group">
        <span className="pipeline-filter-group-label">Status</span>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            className={`pipeline-pill ${filters.statuses.includes(s.value) ? 'pipeline-pill-active' : ''}`}
            aria-pressed={filters.statuses.includes(s.value)}
            onClick={() =>
              onFilterChange({ ...filters, statuses: toggleItem(filters.statuses, s.value) })
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="pipeline-filter-group" style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          className="pipeline-search"
          style={{ paddingLeft: 28 }}
          placeholder="Search company or role..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        />
      </div>
    </div>
  )
}
