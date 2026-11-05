import type { Area, PricedArea } from '../regions/areas'
import { dayTotals, japanDay, priceStats, spreadStats, weightedPrice, type DayTotals } from './daily'
import { SLOTS, type SpotDays } from './jepx'
import { monthOf, type RecordDays, type RecordSlot } from './record'

/** A whole day of the month with its totals, and for a scope of areas the ones left out of them. */
export interface MonthDay {
  date: string
  totals: DayTotals
  missing: readonly Area[]
}

/** A priced day of the month: its lowest and highest half hour, and the mean, or for a half of the grid the price weighted by demand where the records allow it. */
export interface MonthPrice {
  date: string
  low: number
  high: number
  mean: number | null
}

/** The displayed month's records by area, null where the host has none. */
export type MonthRecords = ReadonlyMap<Area, RecordDays | null>

/** An area's whole days of the month in order, each with its border flows; a bar is a day, so a day still running is left out. */
export function recordedMonth(days: RecordDays | null | undefined): MonthDay[] {
  return [...(days?.keys() ?? [])].sort().flatMap((date) => {
    const day = days!.get(date)!
    return day.length === SLOTS ? [{ date, totals: dayTotals(day), missing: [] }] : []
  })
}

/** The areas' whole days of the month summed, in order, any day one of them recorded; a day with an area missing is marked as such. */
export function summedMonth(records: MonthRecords, areas: readonly Area[]): MonthDay[] {
  const dates = new Set(areas.flatMap((a) => [...(records.get(a)?.keys() ?? [])]))
  return [...dates].sort().flatMap((date) => {
    const summed = japanDay(dayRecords(records, areas, date), areas)
    return summed.slots.length === SLOTS ? [{ date, totals: dayTotals(summed.slots), missing: summed.missing }] : []
  })
}

/** The month's priced days in order, the area's price or the system's: each day's low, high and mean. */
export function pricedMonth(spot: SpotDays, month: string, area?: PricedArea): MonthPrice[] {
  return monthDates(spot, month).flatMap((date) => {
    const stats = priceStats(spot.get(date), area)
    return stats ? [{ date, low: stats.low.price, high: stats.high.price, mean: stats.mean }] : []
  })
}

/**
 * The month's priced days for a half of the grid, which has no price of its own: each day's spread across its areas,
 * and its price weighted by demand over the areas that recorded the day where their records are whole, else none.
 */
export function spreadMonth(
  spot: SpotDays,
  month: string,
  areas: readonly PricedArea[],
  records: MonthRecords,
): MonthPrice[] {
  return monthDates(spot, month).flatMap((date) => {
    const spread = spreadStats(spot.get(date), areas)
    if (!spread) return []
    const days = dayRecords(records, areas, date)
    const whole = japanDay(days, areas).slots.length === SLOTS
    const mean = whole ? weightedPrice(spot.get(date), days) : null
    return [{ date, low: spread.low.price, high: spread.high.price, mean }]
  })
}

const monthDates = (spot: SpotDays, month: string) => [...spot.keys()].filter((d) => monthOf(d) === month).sort()

function dayRecords<A extends Area>(
  records: MonthRecords,
  areas: readonly A[],
  date: string,
): Map<A, readonly RecordSlot[]> {
  return new Map(
    areas.flatMap((a) => {
      const day = records.get(a)?.get(date)
      return day ? [[a, day] as const] : []
    }),
  )
}
