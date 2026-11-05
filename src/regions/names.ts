import type { Lang } from '../i18n/strings'
import { AREA_BY_ID, type Area } from './areas'
import type { OcctoLine } from './interconnectors'

/** An area's name in the language. */
export const areaName = (area: Area, lang: Lang) => (lang === 'ja' ? AREA_BY_ID[area].ja : AREA_BY_ID[area].name)

/** A line's name in the language: OCCTO's own in Japanese, the short English label otherwise. */
export const lineName = (line: OcctoLine, lang: Lang) => (lang === 'ja' ? line.name : line.label)

/** Areas by name as a list in the language: Hokkaido and Chubu, 北海道・中部. */
export function areaList(areas: readonly Area[], lang: Lang): string {
  const names = areas.map((a) => areaName(a, lang))
  return lang === 'ja' ? names.join('・') : new Intl.ListFormat('en-US', { type: 'conjunction' }).format(names)
}
