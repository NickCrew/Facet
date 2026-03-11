export const cloneValue = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  // Fallback is intentionally limited to plain JSON-safe values. Persistence
  // snapshots use serializable objects and ISO timestamp strings, so this keeps
  // older environments working while making the boundary explicit in tests.
  return JSON.parse(JSON.stringify(value)) as T
}
