import type { Area } from '../regions/areas'
import { fetchText } from './fetch'

/** The sources in the transmission companies' records, in their column order. */
export const SOURCES = [
  'nuclear',
  'lng',
  'coal',
  'oil',
  'otherThermal',
  'hydro',
  'geothermal',
  'biomass',
  'solar',
  'wind',
  'pumped',
  'battery',
  'interconnector',
  'other',
] as const

export type Source = (typeof SOURCES)[number]

/** One half hour of an area's balance, MW averaged over the half hour; pumping, charging and exports are negative. */
export interface RecordSlot {
  slot: number
  demandMW: number
  bySource: Record<Source, number>
  curtailedMW: { solar: number; wind: number }
}

/** The record by day; the newest day runs only to the latest published half hour. */
export type RecordDays = Map<string, RecordSlot[]>

/** How one transmission company publishes its area's record: the file for a month, and its layout. */
export interface RecordAdapter {
  area: Area
  file: (month: string) => string
  parse: (csv: string) => RecordDays
}

export async function loadRecord(adapter: RecordAdapter, month: string, base = '/data'): Promise<RecordDays | null> {
  const text = await fetchText(`${base}/${adapter.file(month)}`)
  return text === null ? null : adapter.parse(text)
}

/** The month a day belongs to, as the files are named. */
export const monthOf = (date: string) => date.slice(0, 7).replace('-', '')

export function recordSlot(
  days: RecordDays | null | undefined,
  date: string | null,
  slot: number,
): RecordSlot | undefined {
  if (!days || !date) return undefined
  return days.get(date)?.find((s) => s.slot === slot)
}
