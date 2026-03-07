// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Tour } from '../components/Tour'
import { HelpHint } from '../components/HelpHint'
import { TOUR_STEPS } from '../utils/tourSteps'

const mockRect = {
  top: 100,
  left: 100,
  bottom: 140,
  right: 300,
  width: 200,
  height: 40,
  x: 100,
  y: 100,
  toJSON: () => ({}),
}

// Stub ResizeObserver for jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver
}

beforeEach(() => {
  // Create mock target elements for the tour steps
  TOUR_STEPS.forEach(step => {
    const target = document.createElement('div')
    target.setAttribute('data-tour', step.target)
    target.getBoundingClientRect = () => mockRect as DOMRect
    document.body.appendChild(target)
  })

  // Stub scrollIntoView (not implemented in jsdom)
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  cleanup()
  document.querySelectorAll('[data-tour]').forEach((el) => el.remove())
})

describe('Tour', () => {
  it('renders nothing when open={false}', () => {
    const onClose = vi.fn()
    const { container } = render(<Tour open={false} onClose={onClose} />)
    expect(container.innerHTML).toBe('')
    expect(document.querySelector('.tour-overlay')).toBeNull()
  })

  it('renders overlay and card when open={true}', () => {
    const onClose = vi.fn()
    render(<Tour open={true} onClose={onClose} />)
    expect(document.querySelector('.tour-overlay')).not.toBeNull()
    expect(document.querySelector('.tour-card')).not.toBeNull()
  })

  it('navigates through all steps and shows Got it on last step', () => {
    render(<Tour open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Skip')).toBeTruthy()
    
    // Navigate to end
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
      fireEvent.click(screen.getByText('Next'))
    }
    
    expect(screen.getByText('Got it')).toBeTruthy()
    expect(screen.queryByText('Next')).toBeNull()
  })

  it('calls onClose when Skip is clicked', () => {
    const onClose = vi.fn()
    render(<Tour open={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('Skip'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('displays step counter as N / total', () => {
    render(<Tour open={true} onClose={vi.fn()} />)
    expect(screen.getByText(`1 / ${TOUR_STEPS.length}`)).toBeTruthy()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<Tour open={true} onClose={onClose} />)
    const card = screen.getByRole('dialog')
    fireEvent.keyDown(card, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    render(<Tour open={true} onClose={onClose} />)
    const overlay = screen.getByLabelText('Dismiss tour')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('HelpHint', () => {
  it('renders a trigger button with accessible label', () => {
    render(<HelpHint text="Test hint text" />)
    const trigger = screen.getByRole('button', { name: /help/i })
    expect(trigger).not.toBeNull()
    // aria-describedby should always be present as element is always mounted
    expect(trigger.getAttribute('aria-describedby')).not.toBeNull()
  })

  it('toggles visibility on hover', () => {
    render(<HelpHint text="This is helpful" />)
    const trigger = screen.getByRole('button', { name: /help/i })
    const popover = document.querySelector('.help-hint-popover') as HTMLElement
    
    // Closed initially
    expect(popover.style.visibility).toBe('hidden')
    expect(popover.getAttribute('aria-hidden')).toBe('true')

    // Hover to open
    fireEvent.mouseEnter(trigger)
    expect(popover.style.visibility).toBe('visible')
    expect(popover.getAttribute('aria-hidden')).toBe('false')
    expect(screen.getByText('This is helpful')).toBeTruthy()

    // Leave to close
    fireEvent.mouseLeave(trigger)
    expect(popover.style.visibility).toBe('hidden')
    expect(popover.getAttribute('aria-hidden')).toBe('true')
  })

  it('opens on focus and closes on blur', () => {
    render(<HelpHint text="Focus me" />)
    const trigger = screen.getByRole('button', { name: /help/i })
    const popover = document.querySelector('.help-hint-popover') as HTMLElement

    fireEvent.focus(trigger)
    expect(popover.style.visibility).toBe('visible')
    expect(popover.getAttribute('aria-hidden')).toBe('false')

    fireEvent.blur(trigger)
    expect(popover.style.visibility).toBe('hidden')
    expect(popover.getAttribute('aria-hidden')).toBe('true')
  })

  it('closes on Escape', () => {
    render(<HelpHint text="Escape me" />)
    const trigger = screen.getByRole('button', { name: /help/i })
    const popover = document.querySelector('.help-hint-popover') as HTMLElement

    fireEvent.mouseEnter(trigger)
    expect(popover.style.visibility).toBe('visible')
    
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(popover.style.visibility).toBe('hidden')
    expect(popover.getAttribute('aria-hidden')).toBe('true')
  })
})
