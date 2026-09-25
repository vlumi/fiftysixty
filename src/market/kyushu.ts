import { parseJukyu } from './jukyu'
import type { RecordAdapter } from './record'

/**
 * Kyushu's monthly record: the shared layout with quoted cells, the time naming the end of the half hour, and the
 * interconnector counted positive when power leaves Kyushu, which is inverted here.
 */
export const KYUSHU: RecordAdapter = {
  area: 'kyushu',
  file: (month) => `kyushu-jukyu-${month}.csv`,
  parse: (csv) => parseJukyu(csv, { timeMarksEnd: true, interconnectorSign: -1 }),
}
