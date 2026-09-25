import { parseJukyu } from './jukyu'
import type { RecordAdapter } from './record'
import type { Area } from '../regions/areas'

/** A company publishing the shared layout as is: the time naming the start of the half hour and imports positive. */
export const standard = (area: Area, prefix: string): RecordAdapter => ({
  area,
  file: (month) => `${prefix}-jukyu-${month}.csv`,
  parse: (csv) => parseJukyu(csv, { timeMarksEnd: false, interconnectorSign: 1 }),
})
