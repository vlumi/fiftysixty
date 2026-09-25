import { useMemo, type KeyboardEvent, type PointerEvent } from 'react'
import type { RecordSlot } from '../market/record'
import { useStrings } from '../i18n/useStrings'
import { SLOTS } from '../market/jepx'
import { SERIES, stackDay, type StackedSlot } from '../market/stack'
import { clampSlot, slotRange } from '../time/slots'
import styles from './SupplyChart.module.css'

const WIDTH = 320
const HEIGHT = 150
const TOP = 6
const BOTTOM = 16
const PLOT = HEIGHT - TOP - BOTTOM
const GW = 1000

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
  const x = (s: number) => ((s - 0.5) / SLOTS) * WIDTH
  const y = (mw: number) => TOP + ((stack.maxMW - mw) / (stack.maxMW - stack.minMW)) * PLOT
  const band = (top: (s: StackedSlot) => number, bottom: (s: StackedSlot) => number) => {
    const up = stack.slots.map((s) => `${x(s.slot).toFixed(1)},${y(top(s)).toFixed(1)}`)
    const down = [...stack.slots].reverse().map((s) => `${x(s.slot).toFixed(1)},${y(bottom(s)).toFixed(1)}`)
    return `M${up.join('L')}L${down.join('L')}Z`
  }
  const line = (v: (s: StackedSlot) => number) =>
    `M${stack.slots.map((s) => `${x(s.slot).toFixed(1)},${y(v(s)).toFixed(1)}`).join('L')}`
  const gridStep = (stack.maxMW - stack.minMW > 25 * GW ? 10 : 5) * GW
  const gridlines = []
  for (let mw = Math.ceil(stack.minMW / gridStep) * gridStep; mw <= stack.maxMW; mw += gridStep) gridlines.push(mw)
  const curtailed = stack.slots.some((s) => s.curtailedMW > 0)

  const slotAt = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return clampSlot(((e.clientX - rect.left) / rect.width) * SLOTS + 0.5)
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
          <line key={mw} className={styles.grid} x1={0} x2={WIDTH} y1={y(mw)} y2={y(mw)} />
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
        <path
          className={styles.band}
          style={{ fill: 'var(--src-exchange)' }}
          d={band(
            (t) => t.generatedMW + Math.max(0, t.exchangeMW),
            (t) => t.generatedMW,
          )}
        >
          <title>{s.chart.storage}</title>
        </path>
        <path
          className={styles.band}
          style={{ fill: 'var(--src-exchange)' }}
          d={band(
            () => 0,
            (t) => Math.min(0, t.exchangeMW),
          )}
        >
          <title>{s.chart.sentOut}</title>
        </path>
        {curtailed && (
          <path
            className={styles.curtailed}
            d={band(
              (t) => t.generatedMW + Math.max(0, t.exchangeMW) + t.curtailedMW,
              (t) => t.generatedMW + Math.max(0, t.exchangeMW),
            )}
          >
            <title>{s.chart.curtailed}</title>
          </path>
        )}
        <path className={styles.demand} d={line((t) => t.demandMW)} />
        <line className={styles.zero} x1={0} x2={WIDTH} y1={y(0)} y2={y(0)} />
        {gridlines.map((mw) => (
          <text key={mw} className={styles.gridLabel} x={2} y={y(mw) < 14 ? y(mw) + 9 : y(mw) - 2}>
            {mw / GW} {s.chart.gw}
          </text>
        ))}
        <line className={styles.marker} x1={x(slot)} x2={x(slot)} y1={TOP} y2={TOP + PLOT} />
        {[0, 6, 12, 18, 24].map((h) => (
          <text
            key={h}
            className={styles.hour}
            x={(h / 24) * WIDTH}
            y={HEIGHT - 4}
            textAnchor={h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}
          >
            {h}
          </text>
        ))}
      </svg>
      <figcaption className={styles.legend}>
        {[...SERIES].reverse().map((x) => (
          <Key key={x} color={`var(--src-${x})`} name={s.chart.series[x]} />
        ))}
        <Key color="var(--src-exchange)" name={s.chart.storage} />
        <Key color="var(--src-exchange)" name={s.chart.sentOut} />
        {curtailed && <Key color="var(--src-solar)" name={s.chart.curtailed} hatched />}
        <Key color="var(--text)" name={s.chart.demand} line />
      </figcaption>
    </figure>
  )
}

function Key({ color, name, line, hatched }: { color: string; name: string; line?: boolean; hatched?: boolean }) {
  const className = line ? styles.lineKey : hatched ? styles.hatchedKey : styles.swatch
  return (
    <span className={styles.key}>
      <span className={className} style={{ background: line ? undefined : color, borderColor: color }} />
      {name}
    </span>
  )
}
