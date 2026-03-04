import { useRef, type KeyboardEvent } from 'react'
import { THEME_FONT_OPTIONS } from '../themes/theme'

interface FontPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

const SERIF_FONTS = new Set(['Source Serif 4', 'PT Serif', 'Lora', 'Newsreader'])

export function FontPicker({ label, value, onChange }: FontPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const labelId = `font-picker-label-${label.replace(/\s+/g, '-').toLowerCase()}`

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = -1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % THEME_FONT_OPTIONS.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + THEME_FONT_OPTIONS.length) % THEME_FONT_OPTIONS.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = THEME_FONT_OPTIONS.length - 1
    }

    if (nextIndex !== -1) {
      event.preventDefault()
      const nextFont = THEME_FONT_OPTIONS[nextIndex]
      onChange(nextFont)

      // Focus the next button using ref
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('button')
      buttons?.[nextIndex]?.focus()
    }
  }

  return (
    <div className="font-picker" role="group" aria-labelledby={labelId}>
      <span className="field-label" id={labelId}>
        {label}
      </span>
      <div
        ref={containerRef}
        className="font-picker-grid"
        role="radiogroup"
        aria-labelledby={labelId}
      >
        {THEME_FONT_OPTIONS.map((font, index) => {
          const isActive = font === value
          const fallback = SERIF_FONTS.has(font) ? 'serif' : 'sans-serif'
          return (
            <button
              key={font}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={font}
              tabIndex={isActive ? 0 : -1}
              className={`font-option ${isActive ? 'active' : ''}`}
              style={{ fontFamily: `'${font}', ${fallback}` }}
              onClick={() => onChange(font)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              title={font}
            >
              <span className="font-option-preview" aria-hidden="true">
                Aa
              </span>
              <span className="font-option-name">{font}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
