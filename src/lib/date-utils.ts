// =============================================================
// DATE UTILITIES
// Helpers for date-range queries used throughout the app.
// All game scheduling is date-based (not datetime-based), so we
// normalize dates to the start and end of day in UTC.
// =============================================================

// Returns midnight (00:00:00.000) of the given date in UTC
export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// Returns 23:59:59.999 of the given date in UTC
export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(23, 59, 59, 999)
  return d
}

// Formats a Date as YYYY-MM-DD string (for URLs and display)
export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

// Parses a YYYY-MM-DD string into a Date (UTC midnight)
export function fromDateString(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}
