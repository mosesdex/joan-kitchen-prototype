/**
 * All money in this app is an integer number of kobo (1 naira = 100 kobo).
 * Float naira is never stored, only formatted at the edge.
 */

export const KOBO = 100

export function naira(kobo: number): string {
  return `₦${(kobo / KOBO).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

/** Precise form for receipts and reports, e.g. ₦12,500.00 */
export function nairaExact(kobo: number): string {
  return `₦${(kobo / KOBO).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Compact form for dashboard tiles, e.g. ₦1.2m */
export function nairaCompact(kobo: number): string {
  const n = kobo / KOBO
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}k`
  return `₦${Math.round(n)}`
}

/**
 * Percentages are applied to the subtotal and rounded half-up to whole kobo,
 * so the displayed lines always add up to the displayed total.
 */
export function applyRate(subtotal: number, ratePercent: number): number {
  return Math.round((subtotal * ratePercent) / 100)
}
