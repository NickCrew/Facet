import type { ResumeTheme } from '../types'

export interface DesignHealthIssue {
  type: 'error' | 'warning'
  message: string
  key: string
}

export interface DesignHealthReport {
  score: number // 0-100
  issues: DesignHealthIssue[]
}

export function calculateDesignHealth(theme: ResumeTheme): DesignHealthReport {
  const issues: DesignHealthIssue[] = []
  let score = 100

  // 1. Font Size Checks (ATS compatibility)
  if (theme.sizeBody < 9) {
    issues.push({
      type: 'error',
      message: 'Body font size is below 9pt (risky for some ATS parsers).',
      key: 'sizeBody',
    })
    score -= 20
  } else if (theme.sizeBody < 10) {
    issues.push({
      type: 'warning',
      message: 'Body font size is below 10pt (standard minimum).',
      key: 'sizeBody',
    })
    score -= 5
  }

  if (theme.sizeSmall < 7.5) {
    issues.push({
      type: 'error',
      message: 'Small text is extremely small (< 7.5pt).',
      key: 'sizeSmall',
    })
    score -= 10
  }

  // 2. Margin Checks
  const minMargin = 0.4
  const recommendedMargin = 0.5

  if (theme.marginTop < minMargin || theme.marginBottom < minMargin || theme.marginLeft < minMargin || theme.marginRight < minMargin) {
    issues.push({
      type: 'error',
      message: `Margins are below ${minMargin}in (may be cut off during printing).`,
      key: 'margins',
    })
    score -= 15
  } else if (theme.marginTop < recommendedMargin || theme.marginBottom < recommendedMargin || theme.marginLeft < recommendedMargin || theme.marginRight < recommendedMargin) {
    issues.push({
      type: 'warning',
      message: `Margins are below recommended ${recommendedMargin}in.`,
      key: 'margins',
    })
    score -= 5
  }

  // 3. Line Height
  if (theme.lineHeight < 1.0) {
    issues.push({
      type: 'warning',
      message: 'Line height below 1.0 is floored to 1.0 in preview and output.',
      key: 'lineHeight',
    })
    score -= 5
  } else if (theme.lineHeight < 1.1) {
    issues.push({
      type: 'warning',
      message: 'Line height is very tight, which can hurt readability.',
      key: 'lineHeight',
    })
    score -= 10
  }

  return {
    score: Math.max(0, score),
    issues,
  }
}
