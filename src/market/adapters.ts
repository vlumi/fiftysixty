import type { Area } from '../regions/areas'
import { KYUSHU } from './kyushu'
import type { RecordAdapter } from './record'
import { standard } from './standard'
import { TEPCO } from './tepco'

/** The transmission companies by area: eight publish the shared layout as is, Kyushu departs from it. */
export const ADAPTERS: Partial<Record<Area, RecordAdapter>> = {
  hokkaido: standard('hokkaido', 'hokkaido'),
  tohoku: standard('tohoku', 'tohoku'),
  tokyo: TEPCO,
  chubu: standard('chubu', 'chubu'),
  hokuriku: standard('hokuriku', 'hokuriku'),
  kansai: standard('kansai', 'kansai'),
  chugoku: standard('chugoku', 'chugoku'),
  shikoku: standard('shikoku', 'shikoku'),
  kyushu: KYUSHU,
}
