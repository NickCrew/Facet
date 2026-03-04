/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FontPicker } from '../components/FontPicker'
import { THEME_FONT_OPTIONS } from '../themes/theme'

afterEach(cleanup)

describe('FontPicker', () => {
  const defaultProps = {
    label: 'Body Font',
    value: THEME_FONT_OPTIONS[0],
    onChange: vi.fn(),
  }

  it('renders all font options', () => {
    render(<FontPicker {...defaultProps} />)
    const options = screen.getAllByRole('radio')
    expect(options).toHaveLength(THEME_FONT_OPTIONS.length)
  })

  it('marks the selected font as checked', () => {
    render(<FontPicker {...defaultProps} value={THEME_FONT_OPTIONS[1]} />)
    const options = screen.getAllByRole('radio')
    expect(options[1].getAttribute('aria-checked')).toBe('true')
    expect(options[1].tabIndex).toBe(0)
    expect(options[0].getAttribute('aria-checked')).toBe('false')
    expect(options[0].tabIndex).toBe(-1)
  })

  it('calls onChange when a font is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FontPicker {...defaultProps} onChange={onChange} />)
    const options = screen.getAllByRole('radio')
    await user.click(options[2])
    expect(onChange).toHaveBeenCalledWith(THEME_FONT_OPTIONS[2])
  })

  it('navigates with arrow keys', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FontPicker {...defaultProps} value={THEME_FONT_OPTIONS[0]} onChange={onChange} />)
    const options = screen.getAllByRole('radio')
    
    // Focus the first one
    options[0].focus()
    
    // ArrowRight
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith(THEME_FONT_OPTIONS[1])
    
    // ArrowDown
    await user.keyboard('{ArrowDown}')
    expect(onChange).toHaveBeenCalledWith(THEME_FONT_OPTIONS[2])
    
    // ArrowLeft
    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenCalledWith(THEME_FONT_OPTIONS[1])
    
    // ArrowUp
    await user.keyboard('{ArrowUp}')
    expect(onChange).toHaveBeenCalledWith(THEME_FONT_OPTIONS[0])
  })

  it('wraps around at boundaries', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const lastIndex = THEME_FONT_OPTIONS.length - 1
    render(<FontPicker {...defaultProps} value={THEME_FONT_OPTIONS[lastIndex]} onChange={onChange} />)
    const options = screen.getAllByRole('radio')
    
    options[lastIndex].focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith(THEME_FONT_OPTIONS[0])

    cleanup()
    render(<FontPicker {...defaultProps} value={THEME_FONT_OPTIONS[0]} onChange={onChange} />)
    const newOptions = screen.getAllByRole('radio')
    newOptions[0].focus()
    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenCalledWith(THEME_FONT_OPTIONS[lastIndex])
  })

  it('handles Home and End keys', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FontPicker {...defaultProps} value={THEME_FONT_OPTIONS[2]} onChange={onChange} />)
    const options = screen.getAllByRole('radio')
    
    options[2].focus()
    await user.keyboard('{Home}')
    expect(onChange).toHaveBeenCalledWith(THEME_FONT_OPTIONS[0])
    
    await user.keyboard('{End}')
    expect(onChange).toHaveBeenCalledWith(THEME_FONT_OPTIONS[THEME_FONT_OPTIONS.length - 1])
  })

  it('applies correct font fallbacks', () => {
    render(<FontPicker {...defaultProps} />)
    const options = screen.getAllByRole('radio')
    
    // Inter should be sans-serif
    const interIndex = THEME_FONT_OPTIONS.indexOf('Inter')
    expect(options[interIndex].style.fontFamily).toContain('sans-serif')
    
    // Lora should be serif
    const loraIndex = THEME_FONT_OPTIONS.indexOf('Lora')
    expect(options[loraIndex].style.fontFamily).toContain('serif')
    expect(options[loraIndex].style.fontFamily).not.toContain('sans-serif')
  })
})
