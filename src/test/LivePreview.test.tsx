/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { LivePreview, buildPreviewVars } from '../components/LivePreview'
import { pointsToPixels, inchesToPixels, toHexColor } from '../utils/unitConversions'
import { getThemePreset } from '../themes/theme'
import type { AssembledResume } from '../types'

afterEach(cleanup)

const mockAssembled: AssembledResume = {
  selectedVector: 'all',
  header: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    location: 'New York, NY',
    links: [{ url: 'https://example.com' }],
  },
  skillGroups: [],
  roles: [],
  projects: [],
  education: [],
}

const theme = getThemePreset('ferguson-v12')

describe('LivePreview helpers', () => {
  it('pointsToPixels converts points correctly', () => {
    expect(pointsToPixels(12)).toBe('16.00px')
    expect(pointsToPixels(72)).toBe('96.00px')
    expect(pointsToPixels(0)).toBe('0.00px')
  })

  it('inchesToPixels converts inches correctly', () => {
    expect(inchesToPixels(1)).toBe('96.00px')
    expect(inchesToPixels(0.5)).toBe('48.00px')
  })

  it('toHexColor handles hashes correctly', () => {
    expect(toHexColor('ff0000')).toBe('#ff0000')
    expect(toHexColor('#ff0000')).toBe('#ff0000')
  })

  it('buildPreviewVars floors lineHeight <= 1', () => {
    const varsLow = buildPreviewVars({ ...theme, lineHeight: 0.8, sizeBody: 10 }) as Record<string, string>
    expect(varsLow['--preview-line-height']).toBe('1.000')

    const varsOne = buildPreviewVars({ ...theme, lineHeight: 1.0, sizeBody: 10 }) as Record<string, string>
    expect(varsOne['--preview-line-height']).toBe('1.000')

    const varsNormal = buildPreviewVars({ ...theme, lineHeight: 1.5, sizeBody: 10 }) as Record<string, string>
    expect(varsNormal['--preview-line-height']).toBe('1.500')
  })

  it('buildPreviewVars formats bulletChar correctly', () => {
    const varsNone = buildPreviewVars({ ...theme, bulletChar: 'none' }) as Record<string, string>
    expect(varsNone['--preview-bullet-char']).toBe('""')

    const varsBullet = buildPreviewVars({ ...theme, bulletChar: '•' }) as Record<string, string>
    expect(varsBullet['--preview-bullet-char']).toBe('"•"')
  })
})

describe('LivePreview component', () => {
  it('renders header name and contact info', () => {
    render(<LivePreview assembled={mockAssembled} theme={theme} showHeatmap={false} />)
    expect(screen.getByText('John Doe')).toBeDefined()
    expect(screen.getByText(/john@example.com \| 123-456-7890 \| New York, NY/)).toBeDefined()
  })

  it('filters empty contact parts', () => {
    const sparseAssembled = {
      ...mockAssembled,
      header: { ...mockAssembled.header, phone: '', location: '  ' },
    }
    render(<LivePreview assembled={sparseAssembled} theme={theme} showHeatmap={false} />)
    expect(screen.getByText('john@example.com')).toBeDefined()
    // Escape the pipe character in regex
    expect(screen.queryByText(/\|/)).toBeNull()
  })

  it('conditionally renders sections', () => {
    const { rerender } = render(<LivePreview assembled={mockAssembled} theme={theme} showHeatmap={false} />)
    expect(screen.queryByText(/Experience/i)).toBeNull()
    expect(screen.queryByText(/Skills/i)).toBeNull()

    const withData: AssembledResume = {
      ...mockAssembled,
      roles: [{ id: '1', company: 'Co', title: 'T', dates: '2020', bullets: [] }],
      skillGroups: [{ id: '1', label: 'S', content: 'C' }],
    }

    rerender(<LivePreview assembled={withData} theme={theme} showHeatmap={false} />)
    expect(screen.getByText(/Experience/i)).toBeDefined()
    expect(screen.getByText(/Skills/i)).toBeDefined()
  })
})
