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

export type When = 'past' | 'now' | 'ahead'

/** Where a half hour of a day stands against the clock in Japan: the day as days from today, and past, now or ahead. */
export function relation(date: string, slot: number, now: Date): { offset: number; when: When } {
  const offset = daysBetween(jstDate(now), date)
  if (offset !== 0) return { offset, when: offset < 0 ? 'past' : 'ahead' }
  const minutes = jstMinutes(now)
  const start = (slot - 1) * 30
  return { offset, when: start + 30 <= minutes ? 'past' : start > minutes ? 'ahead' : 'now' }
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00Z`) - Date.parse(`${from}T00:00Z`)) / 86_400_000)
}

const JST_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tokyo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** The half hour under way in Japan, 1 to 48. */
export const slotNow = (now: Date) => Math.floor(jstMinutes(now) / 30) + 1

function jstMinutes(now: Date): number {
  const [h, m] = JST_TIME.format(now).split(':').map(Number)
  return (h % 24) * 60 + m
}

/** The day in words for the language, with its weekday: `Thu, 24 Sept 2026` or `2026年9月24日(木)`. */
export function formatDay(date: string, lang: 'en' | 'ja'): string {
  return new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'UTC',
  }).format(Date.parse(`${date}T00:00Z`))
}
