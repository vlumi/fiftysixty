import { PRICED_AREAS } from '../regions/areas'
import type { PricedArea, SpotDays, SpotSlot } from './jepx'

/** A day worth jumping to, found in the prices rather than chosen by hand. */
export interface Story {
  id: string
  name: string
  date: string
  slot: number
  /** What made it: the figure, with its unit. */
  note: string
}

const AREAS = PRICED_AREAS.map((a) => a.id as PricedArea)
const FLOOR = 0.01

const yen = (v: number) => `${v.toFixed(2)} ¥/kWh`
const spread = (s: SpotSlot) => {
  const prices = AREAS.map((a) => s.areaPrice[a])
  return Math.max(...prices) - Math.min(...prices)
}
const floorCount = (slots: SpotSlot[]) =>
  slots.reduce((n, s) => n + AREAS.filter((a) => s.areaPrice[a] <= FLOOR).length, 0)
const mean = (slots: SpotSlot[]) => slots.reduce((sum, s) => sum + s.systemPrice, 0) / slots.length
const month = (date: string) => Number(date.slice(5, 7))
const summer = (date: string) => month(date) >= 6 && month(date) <= 9
const winter = (date: string) => month(date) === 12 || month(date) <= 2

/** The peak half hour of the days that pass the filter, by the system price. */
function peak(days: SpotDays, id: string, name: string, season: (date: string) => boolean): Story | null {
  let best: { date: string; slot: SpotSlot } | null = null
  for (const [date, slots] of days) {
    if (!season(date)) continue
    for (const slot of slots) if (!best || slot.systemPrice > best.slot.systemPrice) best = { date, slot }
  }
  return best && { id, name, date: best.date, slot: best.slot.slot, note: `system price ${yen(best.slot.systemPrice)}` }
}

/**
 * The story days: the summer and the winter peak by the system price, the widest split between areas, the day with
 * the most half hours at the floor, and the cheapest day by the mean system price. Each is the best over all the
 * priced days held, so they move as the data grows.
 */
export function stories(days: SpotDays | null): Story[] {
  if (!days?.size) return []
  const found: (Story | null)[] = [
    peak(days, 'summer', 'Summer peak', summer),
    peak(days, 'winter', 'Winter peak', winter),
  ]

  let widest: { date: string; slot: SpotSlot } | null = null
  for (const [date, slots] of days)
    for (const slot of slots) if (!widest || spread(slot) > spread(widest.slot)) widest = { date, slot }
  if (widest) {
    const prices = AREAS.map((a) => widest.slot.areaPrice[a])
    found.push({
      id: 'split',
      name: 'Widest split',
      date: widest.date,
      slot: widest.slot.slot,
      note: `${yen(Math.min(...prices))} to ${yen(Math.max(...prices))}`,
    })
  }

  let floor: { date: string; count: number; slot: number } | null = null
  for (const [date, slots] of days) {
    const count = floorCount(slots)
    if (count > 0 && (!floor || count > floor.count)) {
      const busiest = slots.reduce((a, b) => (floorCount([b]) > floorCount([a]) ? b : a))
      floor = { date, count, slot: busiest.slot }
    }
  }
  if (floor)
    found.push({
      id: 'floor',
      name: 'Most at the floor',
      date: floor.date,
      slot: floor.slot,
      note: `${floor.count} area half hours at ${yen(FLOOR)}`,
    })

  let cheapest: { date: string; mean: number } | null = null
  for (const [date, slots] of days) {
    const m = mean(slots)
    if (!cheapest || m < cheapest.mean) cheapest = { date, mean: m }
  }
  if (cheapest)
    found.push({
      id: 'cheapest',
      name: 'Cheapest day',
      date: cheapest.date,
      slot: 25,
      note: `mean ${yen(cheapest.mean)}`,
    })

  return found.filter((s): s is Story => s !== null)
}
