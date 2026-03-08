import { useMemo } from 'react'
import { Search, X } from 'lucide-react'
import type { PrepCard, PrepCategory } from '../../types/prep'

interface PrepSearchProps {
  query: string
  category: PrepCategory | 'all'
  vectorFilter: string
  cards: PrepCard[]
  onQueryChange: (q: string) => void
  onCategoryChange: (c: PrepCategory | 'all') => void
  onClearVector: () => void
}

const CATEGORIES: { value: PrepCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'opener', label: 'Opener' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'technical', label: 'Technical' },
  { value: 'project', label: 'Project' },
  { value: 'metrics', label: 'Metrics' },
  { value: 'situational', label: 'Situational' },
]

export function PrepSearch({
  query,
  category,
  vectorFilter,
  cards,
  onQueryChange,
  onCategoryChange,
  onClearVector,
}: PrepSearchProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: cards.length }
    for (const c of cards) {
      map[c.category] = (map[c.category] ?? 0) + 1
    }
    return map
  }, [cards])

  return (
    <div className="prep-search-bar">
      <div className="prep-search-input-wrap">
        <Search size={14} />
        <input
          type="text"
          className="prep-search-input"
          placeholder="Search cards..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="prep-filter-pills">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`prep-pill ${category === c.value ? 'prep-pill-active' : ''}`}
            onClick={() => onCategoryChange(c.value)}
          >
            {c.label}
            {(counts[c.value] ?? 0) > 0 && (
              <span className="prep-pill-count">{counts[c.value]}</span>
            )}
          </button>
        ))}
      </div>

      {vectorFilter && (
        <span className="prep-vector-chip">
          vector: {vectorFilter}
          <button onClick={onClearVector}>
            <X size={12} />
          </button>
        </span>
      )}
    </div>
  )
}
