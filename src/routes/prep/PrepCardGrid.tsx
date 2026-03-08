import type { PrepCard } from '../../types/prep'
import { PrepCardView } from './PrepCardView'

interface PrepCardGridProps {
  cards: PrepCard[]
}

export function PrepCardGrid({ cards }: PrepCardGridProps) {
  return (
    <div className="prep-card-grid">
      {cards.map((card) => (
        <PrepCardView key={card.id} card={card} />
      ))}
    </div>
  )
}
