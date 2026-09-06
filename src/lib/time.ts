const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export { MINUTE, HOUR, DAY }

export function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function dateLabel(ts: number): string {
  return new Date(ts).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** "4m 12s" — used on kitchen tickets where seconds matter. */
export function elapsedPrecise(from: number, now: number): string {
  const total = Math.max(0, Math.floor((now - from) / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

/** "just now" / "6 min ago" / "2 hr ago" — used in lists and feeds. */
export function relativeTime(from: number, now: number = Date.now()): string {
  const diff = now - from
  if (diff < 45_000) return 'just now'
  if (diff < HOUR) return `${Math.round(diff / MINUTE)} min ago`
  if (diff < DAY) return `${Math.round(diff / HOUR)} hr ago`
  return `${Math.round(diff / DAY)} d ago`
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
