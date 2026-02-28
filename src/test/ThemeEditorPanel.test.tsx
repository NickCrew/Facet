// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ThemeEditorPanel } from '../components/ThemeEditorPanel'
import { THEME_PRESETS } from '../themes/theme'

afterEach(cleanup)

function renderPanel(overrides: Partial<{
  open: boolean
}> = {}) {
  const onSetPreset = vi.fn()
  const onSetOverride = vi.fn()
  const onAdjustDensityStep = vi.fn()
  const onResetOverrides = vi.fn()

  render(
    <ThemeEditorPanel
      open={overrides.open ?? true}
      activePreset="ferguson-v12"
      resolvedTheme={THEME_PRESETS['ferguson-v12']}
      onSetPreset={onSetPreset}
      onSetOverride={onSetOverride}
      onAdjustDensityStep={onAdjustDensityStep}
      onResetOverrides={onResetOverrides}
    />,
  )

  return { onSetPreset, onSetOverride, onAdjustDensityStep, onResetOverrides }
}

describe('ThemeEditorPanel preset gallery', () => {
  it('does not render when closed', () => {
    renderPanel({ open: false })
    expect(screen.queryByText('Preset Gallery')).toBeNull()
  })

  it('renders the visual gallery and new preset labels', () => {
    renderPanel()
    expect(screen.getByText('Preset Gallery')).toBeTruthy()
    expect(screen.getAllByText('Executive Serif').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Modern Contrast').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Signal Clean').length).toBeGreaterThan(0)
  })

  it('applies a preset when clicking a card in the gallery strip', () => {
    const { onSetPreset } = renderPanel()
    const gallery = document.querySelector('.theme-gallery-strip')
    expect(gallery).toBeTruthy()

    const button = Array.from(gallery!.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Signal Clean'),
    )
    expect(button).toBeTruthy()
    fireEvent.click(button!)

    expect(onSetPreset).toHaveBeenCalledWith('signal-clean')
  })

  it('supports one-step tighten and loosen spacing controls', () => {
    const { onAdjustDensityStep } = renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Tighten spacing one step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Loosen spacing one step' }))

    expect(onAdjustDensityStep).toHaveBeenNthCalledWith(1, 'tighten')
    expect(onAdjustDensityStep).toHaveBeenNthCalledWith(2, 'loosen')
  })
})
