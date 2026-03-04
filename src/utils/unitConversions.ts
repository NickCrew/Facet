/**
 * Utility functions for syncing Typst units (pt, in) with CSS/Browser units (px).
 * Standard DPI is assumed to be 96.
 */

/**
 * Converts Typst points (1/72 inch) to browser pixels (1/96 inch).
 */
export const pointsToPixels = (value: number): string => `${((value * 96) / 72).toFixed(2)}px`

/**
 * Converts inches to browser pixels (96 DPI).
 */
export const inchesToPixels = (value: number): string => `${(value * 96).toFixed(2)}px`

/**
 * Ensures a hex color string has a leading hash.
 */
export const toHexColor = (value: string): string => (value.startsWith('#') ? value : `#${value}`)

/**
 * US Letter height in pixels (11 inches at 96 DPI).
 */
export const US_LETTER_HEIGHT_PX = 11 * 96
