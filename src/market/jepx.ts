import { PRICED_AREAS, type PricedArea } from '../regions/areas'
import { fetchText } from './fetch'

/** The lowest and the highest price of the half hour across the areas. */
export function slotSpread(slot: SpotSlot, areas: readonly PricedArea[]): [number, number] {
  const prices = areas.map((a) => slot.areaPrice[a])
  return [Math.min(...prices), Math.max(...prices)]
}

/**
 * One half hour of the day-ahead auction: the slot is 1 to 48 from 00:00 JST; the prices, and system-wide what was
 * offered, asked and contracted in kWh.
 */
export interface SpotSlot {
  slot: number
  systemPrice: number
  areaPrice: Record<PricedArea, number>
  sellKWh: number
  buyKWh: number
  volumeKWh: number
}

/** The auction by delivery day, ISO date to its 48 slots in order. */
export type SpotDays = Map<string, SpotSlot[]>

export const SLOTS = 48

/** JEPX's fiscal year runs April to March and names the file; `date` is a day in Japan, YYYY-MM-DD. */
export function fiscalYear(date: string): number {
  const [year, month] = date.split('-').map(Number)
  return month >= 4 ? year : year - 1
}

/** The fiscal year's prices, or none when the host has no file for it, as before the fetcher took last year's. */
export async function loadSpot(year: number, base = '/data'): Promise<SpotDays | null> {
  const text = await fetchText(`${base}/jepx-spot-${year}.csv`)
  return text === null ? null : parseSpot(text)
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
  const sell = column('売り入札量')
  const buy = column('買い入札量')
  const system = column('システムプライス')
  const areas = PRICED_AREAS.map((a) => [a.id, column(`エリアプライス${a.ja}`)] as const)

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
      sellKWh: Number(cells[sell]),
      buyKWh: Number(cells[buy]),
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
