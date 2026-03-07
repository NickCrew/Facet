import React from 'react'

/**
 * Highlights {{variable}} tokens in text for the UI components.
 */
export function highlightVariables(text: string): React.ReactNode[] {
  if (!text) return [text]

  const parts = text.split(/(\{\{[^}]+\}\})/g)
  if (parts.length === 1) return [text]

  return parts.map((part, i) => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      return <code key={i} className="variable-token">{part}</code>
    }
    return part
  })
}
