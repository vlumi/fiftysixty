import type { Lang } from '../i18n/strings'
import { AREA_BY_ID, type Area } from './areas'

/** Areas by name as a list in the language: Hokkaido and Chubu, 北海道・中部. */
export function areaList(areas: readonly Area[], lang: Lang): string {
  const names = areas.map((a) => (lang === 'ja' ? AREA_BY_ID[a].ja : AREA_BY_ID[a].name))
  return lang === 'ja' ? names.join('・') : new Intl.ListFormat('en-US', { type: 'conjunction' }).format(names)
}
