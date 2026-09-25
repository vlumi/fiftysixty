import type { Area } from './areas'

export type Link = 'ac' | 'hvdc' | 'converter'

/** A line between two areas; the capacities and flows arrive with OCCTO's data in M3. */
export interface Interconnector {
  id: string
  name: string
  ends: readonly [Area, Area]
  link: Link
}

/** The ten connections between the nine priced areas; Okinawa stands alone. */
export const INTERCONNECTORS: readonly Interconnector[] = [
  { id: 'kitahon', name: 'Hokkaido–Honshu (Kitahon)', ends: ['hokkaido', 'tohoku'], link: 'hvdc' },
  { id: 'tohoku-tokyo', name: 'Tohoku–Tokyo', ends: ['tohoku', 'tokyo'], link: 'ac' },
  { id: 'fc', name: 'Sakuma, Shin-Shinano and Higashi-Shimizu', ends: ['tokyo', 'chubu'], link: 'converter' },
  { id: 'chubu-hokuriku', name: 'Chubu–Hokuriku', ends: ['chubu', 'hokuriku'], link: 'ac' },
  { id: 'chubu-kansai', name: 'Chubu–Kansai', ends: ['chubu', 'kansai'], link: 'ac' },
  { id: 'hokuriku-kansai', name: 'Hokuriku–Kansai', ends: ['hokuriku', 'kansai'], link: 'ac' },
  { id: 'kansai-chugoku', name: 'Kansai–Chugoku', ends: ['kansai', 'chugoku'], link: 'ac' },
  { id: 'kansai-shikoku', name: 'Kansai–Shikoku (Kii channel)', ends: ['kansai', 'shikoku'], link: 'hvdc' },
  { id: 'chugoku-shikoku', name: 'Chugoku–Shikoku (Honshi)', ends: ['chugoku', 'shikoku'], link: 'ac' },
  { id: 'chugoku-kyushu', name: 'Chugoku–Kyushu (Kanmon)', ends: ['chugoku', 'kyushu'], link: 'ac' },
]

/** The areas one line away, in table order. */
export function neighbors(area: Area): Area[] {
  return INTERCONNECTORS.flatMap(({ ends: [a, b] }) => (a === area ? [b] : b === area ? [a] : []))
}
