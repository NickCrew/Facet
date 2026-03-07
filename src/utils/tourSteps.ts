export interface TourStep {
  target: string
  title: string
  body: string
  placement: 'top' | 'bottom' | 'left' | 'right'
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'vector-bar',
    title: 'Vectors',
    body: 'Vectors are positioning angles for your resume — like "Backend Engineering" or "Security Platform." Select one to tailor your resume to that direction.',
    placement: 'bottom',
  },
  {
    target: 'component-library',
    title: 'Component Library',
    body: 'All your resume content lives here: target lines, profiles, roles with bullets, skill groups, and projects. Each component has per-vector priority settings.',
    placement: 'right',
  },
  {
    target: 'component-card',
    title: 'Component Cards',
    body: 'Each card shows a resume component with its inclusion toggle and vector priorities. Click the toggle to manually include or exclude it for the active vector.',
    placement: 'right',
  },
  {
    target: 'design-tab',
    title: 'Design Tab',
    body: 'Switch to the Design tab to customize typography, spacing, colors, and layout. Choose from theme presets or fine-tune individual values.',
    placement: 'right',
  },
  {
    target: 'preview-panel',
    title: 'Live Preview',
    body: 'Your assembled resume renders here in real time. Switch between high-fidelity PDF and interactive Live views using the toggle in the header.',
    placement: 'left',
  },
  {
    target: 'status-bar',
    title: 'Status Bar',
    body: 'Shows the current page count, bullet count, and skill groups. Warnings appear when you approach or exceed the page budget.',
    placement: 'top',
  },
  {
    target: 'download-btn',
    title: 'Download',
    body: 'When you\'re happy with your resume, download it as a PDF. You can also export the full config as YAML/JSON from the File menu.',
    placement: 'bottom',
  },
]
