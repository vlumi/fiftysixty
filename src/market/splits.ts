import type { Area, Hz } from '../regions/areas'
import { INTERCONNECTORS, type Interconnector } from '../regions/interconnectors'
import type { SpotDays } from './jepx'

/** A priced day's share of half hours, line by line, in which the line's two ends priced apart, which is a market split. */
export interface SplitDay {
  date: string
  shares: number[]
}

/** Every priced day held, in order, over the lines given, as a heatmap draws them: a line a row, a day a column. */
export interface SplitHistory {
  lines: readonly Interconnector[]
  days: SplitDay[]
}

/** The lines whose splits concern the scope: a picked area's own, the frequency converters for a half, else all ten. */
export function scopeLines(area: Area | null, half: Hz | null): readonly Interconnector[] {
  if (area) return INTERCONNECTORS.filter((l) => area !== 'okinawa' && l.ends.includes(area))
  if (half) return INTERCONNECTORS.filter((l) => l.link === 'converter')
  return INTERCONNECTORS
}

export function splitHistory(spot: SpotDays | null, lines: readonly Interconnector[]): SplitHistory {
  const days = [...(spot?.keys() ?? [])].sort().map((date) => {
    const slots = spot!.get(date)!
    const shares = lines.map(
      ({ ends: [a, b] }) => slots.filter((s) => s.areaPrice[a] !== s.areaPrice[b]).length / slots.length,
    )
    return { date, shares }
  })
  return { lines, days }
}
