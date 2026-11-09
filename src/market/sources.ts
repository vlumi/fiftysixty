import type { PricedArea } from '../regions/areas'
import { ADAPTERS } from './adapters'
import type { Fetched } from './fetched'
import { fiscalYear } from './jepx'
import { monthOf } from './record'

/** The publishers behind the figures: JEPX's auction, the transmission companies' records and OCCTO's plan. */
export type Publisher = 'jepx' | 'record' | 'occto'

/** The file a day's figures from the publisher come from: JEPX's fiscal year, OCCTO's month, a company's month. */
export const jepxFile = (date: string) => `jepx-spot-${fiscalYear(date)}.csv`
export const occtoFile = (date: string) => `occto-renkei-${monthOf(date)}.csv`
export const recordFile = (area: PricedArea, date: string) => ADAPTERS[area]!.file(monthOf(date))

/** Which publisher a data file is from, by the fetcher's naming; null for a file of neither. */
export function publisherOf(file: string): Publisher | null {
  if (file.startsWith('jepx-spot-')) return 'jepx'
  if (file.startsWith('occto-renkei-')) return 'occto'
  if (file.includes('-jukyu-')) return 'record'
  return null
}

/** When the host last changed a file of the publisher's, the newest of them, as the fetcher noted it; null without one. */
export function latestFetch(fetched: Fetched | null, publisher: Publisher): string | null {
  if (!fetched) return null
  const times = Object.entries(fetched.files)
    .filter(([file]) => publisherOf(file) === publisher)
    .map(([, at]) => at)
  return times.length ? times.reduce((newest, at) => (at > newest ? at : newest)) : null
}

/** When the host last changed the file, as the fetcher noted it; null when the note has no such file. */
export const fetchTime = (fetched: Fetched | null, file: string): string | null => fetched?.files[file] ?? null
