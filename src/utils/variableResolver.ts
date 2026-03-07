/**
 * Replaces {{placeholder}} tokens in text with values from a registry.
 * If a placeholder is not found, it remains untouched or can be optionally cleared.
 */
export function resolveVariables(text: string, variables: Record<string, string> = {}): string {
  if (!text) return text

  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim()
    if (Object.prototype.hasOwnProperty.call(variables, trimmedKey)) {
      return variables[trimmedKey]
    }
    return match // Keep as is if not found
  })
}
