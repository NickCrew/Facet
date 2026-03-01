import type { ResumeLink } from '../types'

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i

export const toLinkHref = (url: string): string => {
  const trimmed = url.trim()
  if (!trimmed) {
    return ''
  }
  if (SCHEME_PATTERN.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

export const toLinkDisplayText = (link: Pick<ResumeLink, 'label' | 'url'>): string => {
  const label = link.label?.trim() ?? ''
  const url = link.url.trim()
  if (!url) {
    return ''
  }
  if (!label) {
    return url
  }
  return `${label}: ${url}`
}
