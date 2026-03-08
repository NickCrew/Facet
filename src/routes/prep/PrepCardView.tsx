import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { PrepCard } from '../../types/prep'

interface PrepCardViewProps {
  card: PrepCard
}

export function PrepCardView({ card }: PrepCardViewProps) {
  const [copied, setCopied] = useState(false)

  const copyScript = () => {
    if (card.script) {
      void navigator.clipboard.writeText(card.script)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="prep-card">
      <div className="prep-card-header">
        <h3 className="prep-card-title">{card.title}</h3>
        <span className={`prep-category prep-category-${card.category}`}>
          {card.category}
        </span>
      </div>

      {card.tags.length > 0 && (
        <div className="prep-tags">
          {card.tags.map((tag) => (
            <span key={tag} className="prep-tag">{tag}</span>
          ))}
        </div>
      )}

      {card.warning && (
        <div className="prep-warning">
          <div className="prep-warning-label">Caution</div>
          {card.warning}
        </div>
      )}

      {card.script && (
        <div className="prep-script">
          <div className="prep-script-label">Say This</div>
          {card.script}
          <button className="prep-script-copy" onClick={copyScript} title="Copy script">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      {card.followUps && card.followUps.length > 0 && (
        <div className="prep-followups">
          {card.followUps.map((fu, i) => (
            <div key={i} className="prep-followup">
              <div className="prep-followup-q">{fu.question}</div>
              <div className="prep-followup-a">{fu.answer}</div>
            </div>
          ))}
        </div>
      )}

      {card.deepDives && card.deepDives.length > 0 && (
        <div>
          {card.deepDives.map((dd, i) => (
            <details key={i} className="prep-deepdive">
              <summary>{dd.title}</summary>
              <div className="prep-deepdive-content">{dd.content}</div>
            </details>
          ))}
        </div>
      )}

      {card.metrics && card.metrics.length > 0 && (
        <div className="prep-metrics">
          {card.metrics.map((m, i) => (
            <div key={i} className="prep-metric">
              <span className="prep-metric-value">{m.value}</span>
              <span className="prep-metric-label">{m.label}</span>
            </div>
          ))}
        </div>
      )}

      {card.tableData && (
        <div className="prep-table-wrap">
          <table className="prep-table">
            <thead>
              <tr>
                {card.tableData.headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {card.tableData.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
