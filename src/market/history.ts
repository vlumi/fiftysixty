import type { PricedArea } from '../regions/areas'
import { SLOTS, turnover, type SpotDays } from './jepx'

/**
 * A priced day's price per half hour, slot 1 first, for an area or for the system price, NaN where a half hour is
 * missing; and what the auction turned over that day in yen, system-wide whichever price is drawn.
 */
export interface HistoryDay {
  date: string
  prices: number[]
  turnover: number
}

/** Every priced day held, in order, as the heatmap draws them: the area's price or the system's with none given. */
export function priceHistory(spot: SpotDays | null, area?: PricedArea): HistoryDay[] {
  if (!spot) return []
  return [...spot.keys()].sort().map((date) => {
    const slots = spot.get(date)!
    const prices = new Array<number>(SLOTS).fill(NaN)
    for (const s of slots) prices[s.slot - 1] = area ? s.areaPrice[area] : s.systemPrice
    return { date, prices, turnover: turnover(slots) }
  })
}
