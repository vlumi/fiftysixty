import type { SpotDays } from '../market/jepx'
import { latestDay } from '../market/jepx'

const JST = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** The calendar day in Japan, as the market counts them. */
export const jstDate = (now: Date) => JST.format(now)

export function shiftDay(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/**
 * The day to open on: yesterday in Japan, the newest day whose record is complete after the daily fetch, when it is
 * priced; else the newest priced day, which is the case before the data covers yesterday.
 */
export function openingDay(days: SpotDays | null, now: Date): string | null {
  const yesterday = shiftDay(jstDate(now), -1)
  return days?.has(yesterday) ? yesterday : latestDay(days)
}
