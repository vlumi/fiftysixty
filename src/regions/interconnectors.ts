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

/** The middle of the Chubu, Hokuriku and Kansai triangle, where OCCTO's three fences meet on the map. */
export const MIDDLE: readonly [number, number] = [136.4, 35.6]

export type FlowEnd = Area | 'middle'

/**
 * A line as OCCTO publishes it, with its forward direction, which runs north to south and east to west; the two
 * Kansai–Chugoku circuits share an id and are summed. Around the triangle OCCTO publishes fences, each area's
 * boundary against the other two, drawn between the area and the middle.
 */
export interface OcctoLine {
  name: string
  id: string
  from: FlowEnd
  to: FlowEnd
}

export const OCCTO_LINES: readonly OcctoLine[] = [
  { name: '北海道・本州間電力連系設備', id: 'kitahon', from: 'hokkaido', to: 'tohoku' },
  { name: '相馬双葉幹線', id: 'tohoku-tokyo', from: 'tohoku', to: 'tokyo' },
  { name: '周波数変換設備', id: 'fc', from: 'tokyo', to: 'chubu' },
  { name: '中部フェンス', id: 'chubu-fence', from: 'chubu', to: 'middle' },
  { name: '北陸フェンス', id: 'hokuriku-fence', from: 'middle', to: 'hokuriku' },
  { name: '関西フェンス', id: 'kansai-fence', from: 'middle', to: 'kansai' },
  { name: '関西-中国（東）', id: 'kansai-chugoku', from: 'kansai', to: 'chugoku' },
  { name: '関西-中国（西）', id: 'kansai-chugoku', from: 'kansai', to: 'chugoku' },
  { name: '阿南紀北直流幹線', id: 'kansai-shikoku', from: 'kansai', to: 'shikoku' },
  { name: '本四連系線', id: 'chugoku-shikoku', from: 'chugoku', to: 'shikoku' },
  { name: '関門連系線', id: 'chugoku-kyushu', from: 'chugoku', to: 'kyushu' },
]
