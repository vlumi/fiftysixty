import { parseJukyu } from './jukyu'
import type { RecordAdapter } from './record'

/** TEPCO's monthly record: the shared layout, the time naming the start of the half hour and imports positive. */
export const TEPCO: RecordAdapter = {
  area: 'tokyo',
  file: (month) => `tepco-jukyu-${month}.csv`,
  parse: (csv) => parseJukyu(csv, { timeMarksEnd: false, interconnectorSign: 1 }),
}
