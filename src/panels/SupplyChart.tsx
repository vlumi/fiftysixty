import { useMemo } from 'react'
import type { RecordSlot } from '../market/record'
import { useStrings } from '../i18n/useStrings'
import { aboveMW, SERIES, SERIES_TOP_DOWN, stackDay, type StackedSlot } from '../market/stack'
import { mw, percent } from '../shared/format'
import DayChart from './DayChart'
import frame from './DayChart.module.css'
import { RECORD_FIELDS, useProvenance } from './provenance'
import { LEFT, slotX, TOP, WIDTH } from './slotAxis'
import styles from './SupplyChart.module.css'

const PLOT = 128
const GW = 1000

/** The rows that supplied the half hour, whose shares are given: the sources, storage giving back and imports. */
const SUPPLYING = new Set<string>(['storageOut', 'imports', ...SERIES])

const up = (mw: number) => Math.max(0, mw)
const down = (mw: number) => Math.min(0, mw)

/**
 * Storage and the lines, apart: above the generation, storage generating and then imports; below the zero line,
 * storage charging and then exports. Each is a band of its own with its own row in the key.
 */
const EXCHANGE = [
  {
    key: 'storageOut',
    color: 'var(--src-storage)',
    field: RECORD_FIELDS.storage,
    top: (t: StackedSlot) => t.generatedMW + up(t.storageMW),
    bottom: (t: StackedSlot) => t.generatedMW,
    mw: (t: StackedSlot) => up(t.storageMW),
  },
  {
    key: 'imports',
    color: 'var(--src-exchange)',
    field: RECORD_FIELDS.lines,
    top: (t: StackedSlot) => t.generatedMW + up(t.storageMW) + up(t.linesMW),
    bottom: (t: StackedSlot) => t.generatedMW + up(t.storageMW),
    mw: (t: StackedSlot) => up(t.linesMW),
  },
  {
    key: 'storageIn',
    color: 'var(--src-storage)',
    field: RECORD_FIELDS.storage,
    top: () => 0,
    bottom: (t: StackedSlot) => down(t.storageMW),
    mw: (t: StackedSlot) => up(-t.storageMW),
  },
  {
    key: 'exports',
    color: 'var(--src-exchange)',
    field: RECORD_FIELDS.lines,
    top: (t: StackedSlot) => down(t.storageMW),
    bottom: (t: StackedSlot) => down(t.storageMW) + down(t.linesMW),
    mw: (t: StackedSlot) => up(-t.linesMW),
  },
] as const

/** The tooltip for a row of the key: the record's file and the column the row is from. */
type RecordOf = (field: string, note?: string) => string

interface Props {
  day: readonly RecordSlot[]
  slot: number
  onSlot: (slot: number) => void
  /** Names the record behind the key's rows, the one company's or the areas' summed; without it the rows carry no tooltip. */
  provenance?: RecordOf
}

/** The day's supply stack under the demand line, in the day charts' frame, with its key and the half hour's figures under it. */
export default function SupplyChart({ day, slot, onSlot, provenance }: Props) {
  const s = useStrings()
  const stack = useMemo(() => stackDay(day), [day])
  const y = (mw: number) => TOP + ((stack.maxMW - mw) / (stack.maxMW - stack.minMW)) * PLOT
  const band = (top: (s: StackedSlot) => number, bottom: (s: StackedSlot) => number) => {
    const up = stack.slots.map((s) => `${slotX(s.slot).toFixed(1)},${y(top(s)).toFixed(1)}`)
    const down = [...stack.slots].reverse().map((s) => `${slotX(s.slot).toFixed(1)},${y(bottom(s)).toFixed(1)}`)
    return `M${up.join('L')}L${down.join('L')}Z`
  }
  const line = (v: (s: StackedSlot) => number) =>
    `M${stack.slots.map((s) => `${slotX(s.slot).toFixed(1)},${y(v(s)).toFixed(1)}`).join('L')}`
  // About five gridlines whatever the range, from an area's few gigawatts to all Japan's ninety.
  const gridStep = ([5, 10, 20, 50].find((gw) => (stack.maxMW - stack.minMW) / (gw * GW) <= 5) ?? 100) * GW
  const gridlines = []
  for (let mw = Math.ceil(stack.minMW / gridStep) * gridStep; mw <= stack.maxMW; mw += gridStep) gridlines.push(mw)
  const curtailed = stack.slots.some((s) => s.curtailedMW > 0)

  return (
    <figure className={frame.figure}>
      <DayChart label={s.chart.label} plot={PLOT} slot={slot} onSlot={onSlot}>
        {gridlines.map((mw) => (
          <line key={mw} className={frame.grid} x1={LEFT} x2={WIDTH} y1={y(mw)} y2={y(mw)} />
        ))}
        {SERIES.map((x) => (
          <path
            key={x}
            className={styles.band}
            style={{ fill: `var(--src-${x})` }}
            d={band(
              (t) => t.bands[x].from + t.bands[x].value,
              (t) => t.bands[x].from,
            )}
          >
            <title>{s.chart.series[x]}</title>
          </path>
        ))}
        {EXCHANGE.map(({ key, color, top, bottom }) => (
          <path key={key} className={styles.band} style={{ fill: color }} d={band(top, bottom)}>
            <title>{s.chart[key]}</title>
          </path>
        ))}
        {curtailed && (
          <path
            className={styles.curtailed}
            d={band(
              (t) => t.generatedMW + aboveMW(t) + t.curtailedMW,
              (t) => t.generatedMW + aboveMW(t),
            )}
          >
            <title>{s.chart.curtailed}</title>
          </path>
        )}
        <path className={styles.demand} d={line((t) => t.demandMW)} />
        <line className={styles.zero} x1={LEFT} x2={WIDTH} y1={y(0)} y2={y(0)} />
        {gridlines.map((mw) => (
          <text
            key={mw}
            className={mw === 0 ? styles.zeroLabel : frame.gridLabel}
            x={LEFT - 4}
            y={y(mw) + 3}
            textAnchor="end"
          >
            {mw / GW} {s.chart.gw}
          </text>
        ))}
      </DayChart>
      <MixKey
        at={stack.slots.find((t) => t.slot === slot)}
        curtailed={curtailed}
        lines={stack.slots.some((t) => t.linesMW !== 0)}
        provenance={provenance}
      />
    </figure>
  )
}

/**
 * The chart's key and the half hour's figures in one table, read top down as the chart stacks: demand, curtailment,
 * imports and storage generating, the sources, then storage charging and exports below the line. Without a record
 * for the half hour, the figures are dashes and the key still stands.
 */
function MixKey({
  at,
  curtailed,
  lines,
  provenance,
}: {
  at: StackedSlot | undefined
  curtailed: boolean
  /** Whether the day has border flows at all; all Japan has none, and its import and export rows are left out. */
  lines: boolean
  provenance: RecordOf | undefined
}) {
  const s = useStrings()
  const p = useProvenance()
  const row = (e: (typeof EXCHANGE)[number]) => ({
    key: e.key,
    name: s.chart[e.key],
    color: e.color,
    mw: at && e.mw(at),
    field: e.field,
  })
  const rows: {
    key: string
    name: string
    color: string
    mw: number | undefined
    field: string
    kind?: 'line' | 'hatched'
  }[] = [
    {
      key: 'demand',
      name: s.chart.demand,
      color: 'var(--text)',
      mw: at?.demandMW,
      field: RECORD_FIELDS.demand,
      kind: 'line',
    },
    ...(curtailed
      ? [
          {
            key: 'curtailed',
            name: s.chart.curtailed,
            color: 'var(--src-solar)',
            mw: at?.curtailedMW,
            field: RECORD_FIELDS.curtailed,
            kind: 'hatched' as const,
          },
        ]
      : []),
    ...(lines ? [EXCHANGE[1], EXCHANGE[0]] : [EXCHANGE[0]]).map(row),
    ...SERIES_TOP_DOWN.map((x) => ({
      key: x,
      name: s.chart.series[x],
      color: `var(--src-${x})`,
      mw: at?.bands[x].value,
      field: RECORD_FIELDS[x],
    })),
    ...(lines ? [EXCHANGE[2], EXCHANGE[3]] : [EXCHANGE[2]]).map(row),
  ]
  // A supplying row's share of all that supplied the half hour: the generation, storage giving back and imports.
  const supplied = rows.filter((r) => SUPPLYING.has(r.key)).reduce((sum, r) => sum + (r.mw ?? 0), 0)
  const share = (r: (typeof rows)[number]) =>
    SUPPLYING.has(r.key) && r.mw !== undefined && supplied > 0 ? percent(r.mw / supplied) : ''
  return (
    <section aria-label={s.readout.whatRan}>
      <table className={styles.key}>
        <thead>
          <tr>
            <td />
            <th scope="col">{s.readout.mw}</th>
            <th scope="col" title={p.derived(s.readout.source.formula.share)}>
              {s.day.share}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={r.mw === 0 ? styles.idle : r.key === 'demand' ? styles.demandRow : undefined}>
              <th scope="row" title={provenance?.(r.field)}>
                <span
                  className={
                    r.kind === 'line' ? styles.lineKey : r.kind === 'hatched' ? styles.hatchedKey : styles.swatch
                  }
                  style={{ background: r.kind === 'line' ? undefined : r.color, borderColor: r.color }}
                />
                {r.name}
              </th>
              <td>{r.mw === undefined ? '–' : mw(r.mw)}</td>
              <td className={styles.share}>{share(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
