import { SOURCES, type RecordDays, type RecordSlot, type Source } from './record'

/** The column for each source in the layout the transmission companies share, after DATE, TIME and the area demand. */
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

/** How one company departs from the shared layout. */
export interface Layout {
  /** Whether TIME names the end of the half hour, as Kyushu's `0:30` to `24:00`, rather than its start. */
  timeMarksEnd: boolean
  /** The sign to apply to 連系線 so that power taken in is positive. */
  interconnectorSign: 1 | -1
}

/**
 * The half-hourly record in the layout the transmission companies share: a units line, then the header, then one row
 * per half hour in MW averaged over the half hour. Cells may be quoted, the date `2026/9/1` or `20260901`, and the
 * header's parentheses and letters full-width, so both are normalized before the columns are found by name.
 */
export function parseJukyu(csv: string, layout: Layout): RecordDays {
  const lines = csv.trim().split(/\r?\n/)
  const rows = lines.map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')))
  const headerAt = rows.findIndex((r) => r[0] === 'DATE')
  if (headerAt < 0) throw new Error(`record header missing from: ${lines[0]}`)
  const columns = rows[headerAt].map((c) => c.normalize('NFKC'))
  const column = (name: string) => {
    const index = columns.indexOf(name)
    if (index < 0) throw new Error(`record column ${name} missing from: ${lines[headerAt]}`)
    return index
  }
  const demand = column('エリア需要')
  const sources = SOURCES.map((s) => [s, column(COLUMNS[s])] as const)
  const solarCurtailed = column('太陽光出力制御量')
  const windCurtailed = column('風力出力制御量')

  const days: RecordDays = new Map()
  for (const cells of rows.slice(headerAt + 1)) {
    // Some companies lay the whole month out in advance, the half hours to come left blank.
    if (cells.length < columns.length || cells[demand] === '') continue
    const day = isoDate(cells[0])
    const slots = days.get(day) ?? []
    days.set(day, slots)
    const bySource = Object.fromEntries(sources.map(([s, i]) => [s, Number(cells[i])])) as Record<Source, number>
    bySource.interconnector *= layout.interconnectorSign
    const record: RecordSlot = {
      slot: slotOf(cells[1], layout.timeMarksEnd),
      demandMW: Number(cells[demand]),
      bySource,
      curtailedMW: { solar: Number(cells[solarCurtailed]), wind: Number(cells[windCurtailed]) },
    }
    slots.push(record)
  }
  for (const slots of days.values()) slots.sort((a, b) => a.slot - b.slot)
  return days
}

function isoDate(cell: string): string {
  const [y, m, d] = cell.includes('/') ? cell.split('/') : [cell.slice(0, 4), cell.slice(4, 6), cell.slice(6, 8)]
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function slotOf(hm: string, marksEnd: boolean): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 2 + m / 30 + (marksEnd ? 0 : 1)
}
