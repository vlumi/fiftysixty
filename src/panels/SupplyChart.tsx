import { useMemo, type KeyboardEvent, type PointerEvent } from 'react'
import { co2Intensity, dayTotals, renewableShare } from '../market/daily'
import type { RecordSlot } from '../market/record'
import { useStrings } from '../i18n/useStrings'
import { SLOTS } from '../market/jepx'
import { aboveMW, SERIES, stackDay, type StackedSlot } from '../market/stack'
import { clampSlot, slotRange } from '../time/slots'
import styles from './SupplyChart.module.css'

const WIDTH = 320
const HEIGHT = 150
const TOP = 6
const BOTTOM = 16
/** The gutter on the left where the gigawatt labels sit, off the bands. */
const LEFT = 34
const PLOT = HEIGHT - TOP - BOTTOM
const SPAN = WIDTH - LEFT
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
    top: (t: StackedSlot) => t.generatedMW + up(t.storageMW),
    bottom: (t: StackedSlot) => t.generatedMW,
    mw: (t: StackedSlot) => up(t.storageMW),
  },
  {
    key: 'imports',
    color: 'var(--src-exchange)',
    top: (t: StackedSlot) => t.generatedMW + up(t.storageMW) + up(t.linesMW),
    bottom: (t: StackedSlot) => t.generatedMW + up(t.storageMW),
    mw: (t: StackedSlot) => up(t.linesMW),
  },
  {
    key: 'storageIn',
    color: 'var(--src-storage)',
    top: () => 0,
    bottom: (t: StackedSlot) => down(t.storageMW),
    mw: (t: StackedSlot) => up(-t.storageMW),
  },
  {
    key: 'exports',
    color: 'var(--src-exchange)',
    top: (t: StackedSlot) => down(t.storageMW),
    bottom: (t: StackedSlot) => down(t.storageMW) + down(t.linesMW),
    mw: (t: StackedSlot) => up(-t.linesMW),
  },
] as const

interface Props {
  day: readonly RecordSlot[]
  slot: number
  onSlot: (slot: number) => void
}

/**
 * The day's supply stack under the demand line, the displayed half hour marked; pointing or dragging on it moves
 * the half hour, so the readout beside it is the tooltip.
 */
export default function SupplyChart({ day, slot, onSlot }: Props) {
  const s = useStrings()
  const stack = useMemo(() => stackDay(day), [day])
  const x = (s: number) => LEFT + ((s - 0.5) / SLOTS) * SPAN
  const y = (mw: number) => TOP + ((stack.maxMW - mw) / (stack.maxMW - stack.minMW)) * PLOT
  const band = (top: (s: StackedSlot) => number, bottom: (s: StackedSlot) => number) => {
    const up = stack.slots.map((s) => `${x(s.slot).toFixed(1)},${y(top(s)).toFixed(1)}`)
    const down = [...stack.slots].reverse().map((s) => `${x(s.slot).toFixed(1)},${y(bottom(s)).toFixed(1)}`)
    return `M${up.join('L')}L${down.join('L')}Z`
  }
  const line = (v: (s: StackedSlot) => number) =>
    `M${stack.slots.map((s) => `${x(s.slot).toFixed(1)},${y(v(s)).toFixed(1)}`).join('L')}`
  // About five gridlines whatever the range, from an area's few gigawatts to all Japan's ninety.
  const gridStep = ([5, 10, 20, 50].find((gw) => (stack.maxMW - stack.minMW) / (gw * GW) <= 5) ?? 100) * GW
  const gridlines = []
  for (let mw = Math.ceil(stack.minMW / gridStep) * gridStep; mw <= stack.maxMW; mw += gridStep) gridlines.push(mw)
  const curtailed = stack.slots.some((s) => s.curtailedMW > 0)

  const slotAt = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * WIDTH
    return clampSlot(((px - LEFT) / SPAN) * SLOTS + 0.5)
  }
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    onSlot(clampSlot(slot + d))
  }

  return (
    <figure className={styles.figure}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="slider"
        aria-label={s.chart.label}
        aria-valuemin={1}
        aria-valuemax={SLOTS}
        aria-valuenow={slot}
        aria-valuetext={slotRange(slot)}
        tabIndex={0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          onSlot(slotAt(e))
        }}
        onPointerMove={(e) => e.buttons && onSlot(slotAt(e))}
        onKeyDown={onKey}
      >
        {gridlines.map((mw) => (
          <line key={mw} className={styles.grid} x1={LEFT} x2={WIDTH} y1={y(mw)} y2={y(mw)} />
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
            className={mw === 0 ? styles.zeroLabel : styles.gridLabel}
            x={LEFT - 4}
            y={y(mw) + 3}
            textAnchor="end"
          >
            {mw / GW} {s.chart.gw}
          </text>
        ))}
        <line className={styles.marker} x1={x(slot)} x2={x(slot)} y1={TOP} y2={TOP + PLOT} />
        {[0, 6, 12, 18, 24].map((h) => (
          <text
            key={h}
            className={styles.hour}
            x={LEFT + (h / 24) * SPAN}
            y={HEIGHT - 4}
            textAnchor={h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}
          >
            {h}
          </text>
        ))}
      </svg>
      <MixKey
        at={stack.slots.find((t) => t.slot === slot)}
        record={day.find((r) => r.slot === slot)}
        curtailed={curtailed}
        lines={stack.slots.some((t) => t.linesMW !== 0)}
      />
    </figure>
  )
}

/**
 * The chart's key and the half hour's figures in one table, read top down as the chart stacks: demand, curtailment,
 * imports and storage generating, the sources, then storage charging and exports below the line. Without a record for the half hour, the figures are
 * dashes and the key still stands.
 */
/** `lines`: whether the day has border flows at all; all Japan has none, and its import and export rows are left out. */
function MixKey({
  at,
  record,
  curtailed,
  lines,
}: {
  at: StackedSlot | undefined
  record: RecordSlot | undefined
  curtailed: boolean
  lines: boolean
}) {
  const s = useStrings()
  const half = record && dayTotals([record])
  const row = (e: (typeof EXCHANGE)[number]) => ({
    key: e.key,
    name: s.chart[e.key],
    color: e.color,
    mw: at && e.mw(at),
  })
  const rows: { key: string; name: string; color: string; mw: number | undefined; kind?: 'line' | 'hatched' }[] = [
    { key: 'demand', name: s.chart.demand, color: 'var(--text)', mw: at?.demandMW, kind: 'line' },
    ...(curtailed
      ? [
          {
            key: 'curtailed',
            name: s.chart.curtailed,
            color: 'var(--src-solar)',
            mw: at?.curtailedMW,
            kind: 'hatched' as const,
          },
        ]
      : []),
    ...(lines ? [EXCHANGE[1], EXCHANGE[0]] : [EXCHANGE[0]]).map(row),
    ...[...SERIES].reverse().map((x) => ({
      key: x,
      name: s.chart.series[x],
      color: `var(--src-${x})`,
      mw: at?.bands[x].value,
    })),
    ...(lines ? [EXCHANGE[2], EXCHANGE[3]] : [EXCHANGE[2]]).map(row),
  ]
  // A supplying row's share of all that supplied the half hour: the generation, storage giving back and imports.
  const supplied = rows.filter((r) => SUPPLYING.has(r.key)).reduce((sum, r) => sum + (r.mw ?? 0), 0)
  const share = (r: (typeof rows)[number]) =>
    SUPPLYING.has(r.key) && r.mw !== undefined && supplied > 0 ? `${Math.round((r.mw / supplied) * 100)}%` : ''
  return (
    <section aria-label={s.readout.whatRan}>
      <table className={styles.key}>
        <thead>
          <tr>
            <td />
            <th scope="col">{s.readout.mw}</th>
            <th scope="col">{s.day.share}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={r.mw === 0 ? styles.idle : r.key === 'demand' ? styles.demandRow : undefined}>
              <th scope="row">
                <span
                  className={
                    r.kind === 'line' ? styles.lineKey : r.kind === 'hatched' ? styles.hatchedKey : styles.swatch
                  }
                  style={{ background: r.kind === 'line' ? undefined : r.color, borderColor: r.color }}
                />
                {r.name}
              </th>
              <td>{r.mw === undefined ? '–' : Math.round(r.mw).toLocaleString('en-US')}</td>
              <td className={styles.share}>{share(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {half && (
        <dl className={styles.figures}>
          <dt>{s.day.renewables}</dt>
          <dd>{Math.round(renewableShare(half) * 100)}%</dd>
          <dt>{s.day.co2Intensity}</dt>
          <dd>
            {Math.round(co2Intensity(half))} <span className="muted">g · {s.day.estimated}</span>
          </dd>
        </dl>
      )}
    </section>
  )
}
