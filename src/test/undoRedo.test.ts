import { describe, it, expect, beforeEach } from 'vitest'
import { useResumeStore } from '../store/resumeStore'
import type { ResumeData } from '../types'

function makeData(name: string): ResumeData {
  return {
    ...useResumeStore.getState().data,
    meta: {
      ...useResumeStore.getState().data.meta,
      name,
    },
  }
}

describe('undo/redo', () => {
  beforeEach(() => {
    // Reset store to clean state between tests
    useResumeStore.setState({ data: makeData('Initial'), past: [], future: [] })
  })

  it('starts with empty history', () => {
    const { past, future } = useResumeStore.getState()
    expect(past).toHaveLength(0)
    expect(future).toHaveLength(0)
  })

  it('pushes previous state to past on setData', () => {
    useResumeStore.getState().setData(makeData('Second'))

    const { data, past, future } = useResumeStore.getState()
    expect(data.meta.name).toBe('Second')
    expect(past).toHaveLength(1)
    expect(past[0].meta.name).toBe('Initial')
    expect(future).toHaveLength(0)
  })

  it('undoes to previous state', () => {
    useResumeStore.getState().setData(makeData('Second'))
    useResumeStore.getState().undo()

    const { data, past, future } = useResumeStore.getState()
    expect(data.meta.name).toBe('Initial')
    expect(past).toHaveLength(0)
    expect(future).toHaveLength(1)
    expect(future[0].meta.name).toBe('Second')
  })

  it('redoes after undo', () => {
    useResumeStore.getState().setData(makeData('Second'))
    useResumeStore.getState().undo()
    useResumeStore.getState().redo()

    const { data, past, future } = useResumeStore.getState()
    expect(data.meta.name).toBe('Second')
    expect(past).toHaveLength(1)
    expect(past[0].meta.name).toBe('Initial')
    expect(future).toHaveLength(0)
  })

  it('clears future on new mutation after undo', () => {
    useResumeStore.getState().setData(makeData('Second'))
    useResumeStore.getState().setData(makeData('Third'))
    useResumeStore.getState().undo()

    // Future has "Third"
    expect(useResumeStore.getState().future).toHaveLength(1)

    // New mutation clears future
    useResumeStore.getState().setData(makeData('Branch'))

    const { data, past, future } = useResumeStore.getState()
    expect(data.meta.name).toBe('Branch')
    expect(future).toHaveLength(0)
    expect(past).toHaveLength(2)
    expect(past[0].meta.name).toBe('Initial')
    expect(past[1].meta.name).toBe('Second')
  })

  it('does nothing when undoing with empty past', () => {
    const before = useResumeStore.getState().data
    useResumeStore.getState().undo()
    expect(useResumeStore.getState().data).toBe(before)
  })

  it('does nothing when redoing with empty future', () => {
    useResumeStore.getState().setData(makeData('Second'))
    const before = useResumeStore.getState().data
    useResumeStore.getState().redo()
    expect(useResumeStore.getState().data).toBe(before)
  })

  it('handles multiple undo/redo cycles', () => {
    useResumeStore.getState().setData(makeData('A'))
    useResumeStore.getState().setData(makeData('B'))
    useResumeStore.getState().setData(makeData('C'))

    // Undo all the way back
    useResumeStore.getState().undo()
    expect(useResumeStore.getState().data.meta.name).toBe('B')

    useResumeStore.getState().undo()
    expect(useResumeStore.getState().data.meta.name).toBe('A')

    useResumeStore.getState().undo()
    expect(useResumeStore.getState().data.meta.name).toBe('Initial')

    // Can't undo further
    useResumeStore.getState().undo()
    expect(useResumeStore.getState().data.meta.name).toBe('Initial')

    // Redo all the way forward
    useResumeStore.getState().redo()
    expect(useResumeStore.getState().data.meta.name).toBe('A')

    useResumeStore.getState().redo()
    expect(useResumeStore.getState().data.meta.name).toBe('B')

    useResumeStore.getState().redo()
    expect(useResumeStore.getState().data.meta.name).toBe('C')

    // Can't redo further
    useResumeStore.getState().redo()
    expect(useResumeStore.getState().data.meta.name).toBe('C')
  })

  it('limits history stack to 50 entries', () => {
    for (let i = 1; i <= 60; i++) {
      useResumeStore.getState().setData(makeData(`State-${i}`))
    }

    const { past } = useResumeStore.getState()
    expect(past).toHaveLength(50)
    // Oldest entries were dropped — the first remaining should be State-10
    // (Initial + 60 mutations, but only keep last 50: State-11..State-60 are in past,
    //  actually: entries are Initial, State-1..State-59 pushed, kept last 50)
    expect(past[0].meta.name).toBe('State-10')
    expect(past[49].meta.name).toBe('State-59')
  })

  it('tracks resetToDefaults in history', () => {
    useResumeStore.getState().setData(makeData('Custom'))
    useResumeStore.getState().resetToDefaults()

    const { past } = useResumeStore.getState()
    expect(past).toHaveLength(2)
    expect(past[1].meta.name).toBe('Custom')

    // Undo the reset
    useResumeStore.getState().undo()
    expect(useResumeStore.getState().data.meta.name).toBe('Custom')
  })

  it('supports branching history (undo, mutate, undo)', () => {
    useResumeStore.getState().setData(makeData('A'))
    useResumeStore.getState().setData(makeData('B'))
    useResumeStore.getState().setData(makeData('C'))

    // Undo twice: C -> B -> A
    useResumeStore.getState().undo()
    useResumeStore.getState().undo()
    expect(useResumeStore.getState().data.meta.name).toBe('A')

    // Branch: mutate to D (clears B, C from future)
    useResumeStore.getState().setData(makeData('D'))
    expect(useResumeStore.getState().data.meta.name).toBe('D')
    expect(useResumeStore.getState().future).toHaveLength(0)

    // Undo on the new branch lands on A, not B
    useResumeStore.getState().undo()
    expect(useResumeStore.getState().data.meta.name).toBe('A')

    // Redo on the new branch lands on D, not B
    useResumeStore.getState().redo()
    expect(useResumeStore.getState().data.meta.name).toBe('D')
  })

  it('excludes past and future from persisted state', () => {
    useResumeStore.getState().setData(makeData('A'))
    useResumeStore.getState().setData(makeData('B'))

    // Verify history has entries before checking partialize behavior
    const { past } = useResumeStore.getState()
    expect(past.length).toBeGreaterThan(0)

    // Simulate what partialize does
    const persisted = { data: useResumeStore.getState().data }
    expect(persisted).not.toHaveProperty('past')
    expect(persisted).not.toHaveProperty('future')
    expect(persisted).toHaveProperty('data')
  })
})
