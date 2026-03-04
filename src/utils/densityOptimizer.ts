import type { AssembledResume, ResumeTheme, ResumeThemeOverrides } from '../types'
import { THEME_DENSITY_KEYS } from '../themes/theme'
import { renderResumeAsPdf } from './typstRenderer'

export interface OptimizationResult {
  overrides: ResumeThemeOverrides
  finalPageCount: number
  iterations: number
}

/**
 * Iteratively adjusts theme density to fit the resume into a target number of pages.
 * Uses binary search on a global multiplier for all density-related tokens.
 */
export async function findOptimalDensity(
  resume: AssembledResume,
  baseTheme: ResumeTheme,
  targetPages: number,
  maxIterations: number = 8,
): Promise<OptimizationResult> {
  let minMultiplier = 0.7 // Tightest
  let maxMultiplier = 1.3 // Loosest
  let currentMultiplier = 1.0
  let bestOverrides: ResumeThemeOverrides = {}
  let bestPageCount = 0
  let iterations = 0

  while (iterations < maxIterations) {
    iterations++
    currentMultiplier = (minMultiplier + maxMultiplier) / 2

    const currentOverrides: ResumeThemeOverrides = {}
    for (const key of THEME_DENSITY_KEYS) {
      const baseValue = (baseTheme as any)[key]
      if (typeof baseValue === 'number') {
        ;(currentOverrides as any)[key] = Number((baseValue * currentMultiplier).toFixed(3))
      }
    }

    const themeWithOverrides: ResumeTheme = {
      ...baseTheme,
      ...currentOverrides,
    }

    const { pageCount } = await renderResumeAsPdf(resume, themeWithOverrides)

    if (pageCount <= targetPages) {
      // It fits! Try to loosen it up to fill the space.
      bestOverrides = { ...currentOverrides }
      bestPageCount = pageCount
      minMultiplier = currentMultiplier
    } else {
      // Too long! Need to tighten.
      maxMultiplier = currentMultiplier
      // Even if it doesn't fit, track the best (smallest) page count we've seen
      if (bestPageCount === 0 || pageCount < bestPageCount) {
        bestPageCount = pageCount
      }
    }

    // If we've converged enough, stop early
    if (maxMultiplier - minMultiplier < 0.01) {
      break
    }
  }

  return {
    overrides: bestOverrides,
    finalPageCount: bestPageCount,
    iterations,
  }
}
