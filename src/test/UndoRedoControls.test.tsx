// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UndoRedoControls } from '../components/UndoRedoControls'
import { useResumeStore } from '../store/resumeStore'
import type { ResumeData } from '../types'

afterEach(cleanup)

function makeData(name: string): ResumeData {
  return {
    ...useResumeStore.getState().data,
    meta: {
      ...useResumeStore.getState().data.meta,
      name,
    },
  }
}

describe('UndoRedoControls', () => {
  beforeEach(() => {
    useResumeStore.setState({ data: makeData('Initial'), past: [], future: [] })
  })

  it('renders undo and redo buttons', () => {
    render(<UndoRedoControls />)
    expect(screen.getByLabelText('Undo')).toBeTruthy()
    expect(screen.getByLabelText('Redo')).toBeTruthy()
  })

  it('disables both buttons when history is empty', () => {
    render(<UndoRedoControls />)
    expect((screen.getByLabelText('Undo') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Redo') as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables undo after a mutation', () => {
    useResumeStore.getState().setData(makeData('Second'))
    render(<UndoRedoControls />)
    expect((screen.getByLabelText('Undo') as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByLabelText('Redo') as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables redo after an undo', () => {
    useResumeStore.getState().setData(makeData('Second'))
    useResumeStore.getState().undo()
    render(<UndoRedoControls />)
    expect((screen.getByLabelText('Undo') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Redo') as HTMLButtonElement).disabled).toBe(false)
  })

  it('clicking undo restores previous state', async () => {
    useResumeStore.getState().setData(makeData('Second'))
    render(<UndoRedoControls />)

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Undo'))

    expect(useResumeStore.getState().data.meta.name).toBe('Initial')
  })

  it('clicking redo restores undone state', async () => {
    useResumeStore.getState().setData(makeData('Second'))
    useResumeStore.getState().undo()
    render(<UndoRedoControls />)

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Redo'))

    expect(useResumeStore.getState().data.meta.name).toBe('Second')
  })

  it('displays shortcut hints in tooltips', () => {
    render(<UndoRedoControls />)
    expect(screen.getByTitle(/⌘Z/)).toBeTruthy()
    expect(screen.getByTitle(/⌘⇧Z/)).toBeTruthy()
  })
})
