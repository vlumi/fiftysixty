import type { Area } from '../regions/areas'
import { KYUSHU } from './kyushu'
import type { RecordAdapter } from './record'
import { TEPCO } from './tepco'

/** The transmission companies wired so far, by area; the rest follow as their layouts are adapted. */
export const ADAPTERS: Partial<Record<Area, RecordAdapter>> = { tokyo: TEPCO, kyushu: KYUSHU }
