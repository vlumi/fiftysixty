import { SOURCES, type RecordAdapter, type RecordDays, type RecordSlot, type Source } from './record'

/** TEPCO's column for each source, after DATE, TIME and the area demand. */
const COLUMNS: Record<Source, string> = {
  nuclear: '原子力',
  lng: '火力(LNG)',
  coal: '火力(石炭)',
  oil: '火力(石油)',
  otherThermal: '火力(その他)',
  hydro: '水力',
  geothermal: '地熱',
  biomass: 'バイオマス',
  solar: '太陽光発電実績',
  wind: '風力発電実績',
  pumped: '揚水',
  battery: '蓄電池',
  interconnector: '連系線',
  other: 'その他',
}

/**
 * TEPCO's monthly record: a units line, then the header, then one row per half hour with the date as
 * `2026/9/1` and the time as `0:00`, in MW averaged over the half hour.
 */
export const TEPCO: RecordAdapter = {
  area: 'tokyo',
  file: (month) => `tepco-jukyu-${month}.csv`,
  parse(csv) {
    const lines = csv.trim().split(/\r?\n/)
    const headerAt = lines.findIndex((l) => l.startsWith('DATE,'))
    if (headerAt < 0) throw new Error(`TEPCO header missing from: ${lines[0]}`)
    const columns = lines[headerAt].split(',').map((c) => c.trim())
    const column = (name: string) => {
      const index = columns.indexOf(name)
      if (index < 0) throw new Error(`TEPCO column ${name} missing from: ${lines[headerAt]}`)
      return index
    }
    const demand = column('エリア需要')
    const sources = SOURCES.map((s) => [s, column(COLUMNS[s])] as const)
    const solarCurtailed = column('太陽光出力制御量')
    const windCurtailed = column('風力出力制御量')

    const days: RecordDays = new Map()
    for (const line of lines.slice(headerAt + 1)) {
      if (!line) continue
      const cells = line.split(',')
      const day = isoDate(cells[0])
      const slots = days.get(day) ?? []
      days.set(day, slots)
      const record: RecordSlot = {
        slot: slotOf(cells[1]),
        demandMW: Number(cells[demand]),
        bySource: Object.fromEntries(sources.map(([s, i]) => [s, Number(cells[i])])) as Record<Source, number>,
        curtailedMW: { solar: Number(cells[solarCurtailed]), wind: Number(cells[windCurtailed]) },
      }
      slots.push(record)
    }
    for (const slots of days.values()) slots.sort((a, b) => a.slot - b.slot)
    return days
  },
}

function isoDate(ymd: string): string {
  const [y, m, d] = ymd.split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function slotOf(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 2 + m / 30 + 1
}
