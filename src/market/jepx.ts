import { PRICED_AREAS, type Area } from '../regions/areas'

export type PricedArea = Exclude<Area, 'okinawa'>

/** One half hour of the day-ahead auction: the slot is 1 to 48 from 00:00 JST. */
export interface SpotSlot {
  slot: number
  systemPrice: number
  areaPrice: Record<PricedArea, number>
  volumeKWh: number
}

/** The auction by delivery day, ISO date to its 48 slots in order. */
export type SpotDays = Map<string, SpotSlot[]>

export const SLOTS = 48

/** JEPX's fiscal year runs April to March and names the file. */
export function fiscalYear(date: Date): number {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1
}

/** The fiscal year's prices, or none when the host has no file for it, as before the fetcher took last year's. */
export async function loadSpot(year: number, base = '/data'): Promise<SpotDays | null> {
  const url = `${base}/jepx-spot-${year}.csv`
  const response = await fetch(url)
  if (response.status === 404 || response.headers.get('content-type')?.includes('text/html')) return null
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return parseSpot(await response.text())
}

/** This fiscal year's prices and last year's together, by day. */
export async function loadSpotYears(year: number, base = '/data'): Promise<SpotDays> {
  const years = await Promise.all([year - 1, year].map((y) => loadSpot(y, base)))
  return new Map(years.flatMap((days) => (days ? [...days] : [])))
}

/** Parses JEPX's spot_summary CSV: a Japanese header, then one row per half hour. Columns are found by name. */
export function parseSpot(csv: string): SpotDays {
  const [header, ...rows] = csv.trim().split(/\r?\n/)
  const columns = header.split(',')
  const column = (name: string) => {
    const index = columns.findIndex((c) => c.startsWith(name))
    if (index < 0) throw new Error(`JEPX column ${name} missing from: ${header}`)
    return index
  }
  const date = column('受渡日')
  const slot = column('時刻コード')
  const volume = column('約定総量')
  const system = column('システムプライス')
  const areas = PRICED_AREAS.map((a) => [a.id as PricedArea, column(`エリアプライス${a.ja}`)] as const)

  const days: SpotDays = new Map()
  for (const row of rows) {
    if (!row) continue
    const cells = row.split(',')
    const day = cells[date].replaceAll('/', '-')
    const slots = days.get(day) ?? []
    days.set(day, slots)
    slots.push({
      slot: Number(cells[slot]),
      systemPrice: Number(cells[system]),
      areaPrice: Object.fromEntries(areas.map(([id, i]) => [id, Number(cells[i])])) as Record<PricedArea, number>,
      volumeKWh: Number(cells[volume]),
    })
  }
  for (const slots of days.values()) slots.sort((a, b) => a.slot - b.slot)
  return days
}

/** The newest delivery day in the data: tomorrow once the auction has run, else today. */
export function latestDay(days: SpotDays | null): string | null {
  if (!days?.size) return null
  return [...days.keys()].sort().at(-1)!
}

export function slotOf(days: SpotDays | null, date: string | null, slot: number): SpotSlot | undefined {
  if (!days || !date) return undefined
  return days.get(date)?.find((s) => s.slot === slot)
}
