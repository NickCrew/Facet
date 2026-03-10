import type { AssembledResume } from '../../types'

export const buildAssembledResume = (overrides: Partial<AssembledResume> = {}): AssembledResume => ({
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
  certifications: [],
  ...overrides,
})
