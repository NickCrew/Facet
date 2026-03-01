// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'

afterEach(cleanup)
import { VectorPriorityEditor } from '../components/VectorPriorityEditor'
import type { PriorityByVector, VectorDef } from '../types'

const vectorDefs: VectorDef[] = [
  { id: 'backend', label: 'Backend', color: '#3b82f6' },
  { id: 'security', label: 'Security', color: '#ef4444' },
]

function renderEditor(overrides: Partial<{
  vectors: PriorityByVector
  vectorDefs: VectorDef[]
  onChange: (v: PriorityByVector) => void
}> = {}) {
  const props = {
    vectors: { backend: 'must' as const },
    vectorDefs,
    onChange: vi.fn(),
    ...overrides,
  }
  const result = render(<VectorPriorityEditor {...props} />)
  return { ...result, ...props }
}

describe('VectorPriorityEditor', () => {
  it('renders nothing when vectorDefs is empty', () => {
    const { container } = renderEditor({ vectorDefs: [] })
    expect(container.innerHTML).toBe('')
  })

  it('renders a fieldset with legend', () => {
    renderEditor()
    expect(screen.getByText('Vector Priority')).toBeTruthy()
  })

  it('renders a row for each vector', () => {
    renderEditor()
    expect(screen.getByText('Backend')).toBeTruthy()
    expect(screen.getByText('Security')).toBeTruthy()
  })

  it('shows the current priority in the select', () => {
    renderEditor({ vectors: { backend: 'must', security: 'strong' } })
    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveProperty('value', 'must')
    expect(selects[1]).toHaveProperty('value', 'strong')
  })

  it('defaults to exclude when vector has no priority', () => {
    renderEditor({ vectors: {} })
    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveProperty('value', 'exclude')
    expect(selects[1]).toHaveProperty('value', 'exclude')
  })

  it('calls onChange with updated priority when selecting a value', () => {
    const { onChange } = renderEditor({ vectors: { backend: 'must' } })
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'strong' } })
    expect(onChange).toHaveBeenCalledWith({ backend: 'strong' })
  })

  it('removes vector key from map when setting to exclude', () => {
    const { onChange } = renderEditor({ vectors: { backend: 'must', security: 'strong' } })
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'exclude' } })
    expect(onChange).toHaveBeenCalledWith({ security: 'strong' })
  })

  it('adds vector key when changing from exclude to a priority', () => {
    const { onChange } = renderEditor({ vectors: {} })
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'optional' } })
    expect(onChange).toHaveBeenCalledWith({ security: 'optional' })
  })

  it('renders all four priority options in each select', () => {
    renderEditor()
    const options = screen.getAllByRole('option')
    // 4 options per select × 2 selects = 8
    expect(options).toHaveLength(8)
    const labels = options.map((o) => o.textContent)
    expect(labels).toContain('Must')
    expect(labels).toContain('Strong')
    expect(labels).toContain('Optional')
    expect(labels).toContain('Exclude')
  })
})
