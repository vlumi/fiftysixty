import { fetchText } from './fetch'

/** The fetcher's note of its last run and of each file's time, as it writes them beside the data. */
export interface Fetched {
  at: string
  files: Readonly<Record<string, string>>
}

const isTime = (x: unknown): x is string => typeof x === 'string' && Number.isFinite(Date.parse(x))

/** The note parsed; null when it is not one. */
export function parseFetched(text: string): Fetched | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const { at, files } = parsed as { at?: unknown; files?: unknown }
  if (!isTime(at) || typeof files !== 'object' || files === null) return null
  const times = Object.entries(files).filter((entry): entry is [string, string] => isTime(entry[1]))
  return { at, files: Object.fromEntries(times) }
}

export async function loadFetched(base = '/data'): Promise<Fetched | null> {
  const text = await fetchText(`${base}/fetched.json`)
  return text === null ? null : parseFetched(text)
}
