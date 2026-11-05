import { useMemo, type PointerEvent } from 'react'
import { useStrings } from '../i18n/useStrings'
import { durationCurve } from '../market/duration'
import type { HistoryDay } from '../market/history'
import { percent, yen } from '../shared/format'
import { priceAxis } from '../shared/scale'
import { scrub } from '../shared/scrub'
import { useApp } from '../store'
import { formatDay } from '../time/days'
import { slotRange } from '../time/slots'
import frame from './DayChart.module.css'
import styles from './DurationCurve.module.css'
import { scopeHz, type PricedScope } from './readout/scope'
import { LEFT, SPAN, TOP, WIDTH } from './slotAxis'

const PLOT = 96
const FOOT = 16
const SHARES = [0, 0.25, 0.5, 0.75, 1]

/**
 * The price duration curve: every priced half hour held, sorted from the dearest down across the width, so how much
 * of the time sat at the floor or near the cap reads at a glance; the displayed half hour is marked where it ranks.
 * The picked area's price in its half's color, the system price for a half and for all Japan. It is a slider over
 * the ranks: a press picks the half hour whose price ranks there, so a drag walks the history from the dearest half
 * hour to the cheapest.
 */
export default function DurationCurve({
  days,
  scope,
  date,
  slot,
  onPick,
}: {
  days: readonly HistoryDay[]
  scope: PricedScope
  date: string | null
  slot: number
  onPick: (date: string, slot: number) => void
}) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const d = useMemo(() => durationCurve(days), [days])
  if (!d) return null
  const { top, step } = priceAxis(d.curve[0])
  const x = (share: number) => LEFT + share * SPAN
  const y = (p: number) => TOP + (1 - p / top) * PLOT
  const last = d.curve.length - 1
  const path = `M${d.curve.map((p, i) => `${x(i / last).toFixed(1)},${y(p).toFixed(1)}`).join('L')}`
  const rank = date ? d.ranked.findIndex((r) => r.date === date && r.slot === slot) : -1
  const share = rank < 0 ? null : rank / (d.ranked.length - 1)
  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const fx = (((e.clientX - rect.left) / rect.width) * WIDTH - LEFT) / SPAN
    const at = d.ranked[Math.min(d.ranked.length - 1, Math.max(0, Math.round(fx * (d.ranked.length - 1))))]
    onPick(at.date, at.slot)
  }
  const gridlines = []
  for (let p = 0; p <= top; p += step) gridlines.push(p)
  const hz = scope.kind === 'area' ? scopeHz(scope) : null
  const height = TOP + PLOT + FOOT

  return (
    <figure className={frame.figure}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="slider"
        aria-label={s.chart.duration}
        aria-valuemin={1}
        aria-valuemax={d.ranked.length}
        aria-valuenow={rank + 1}
        aria-valuetext={
          rank >= 0
            ? `${formatDay(d.ranked[rank].date, lang)} ${slotRange(d.ranked[rank].slot)}: ${yen(d.ranked[rank].price)} ${s.readout.yenPerKwh}`
            : undefined
        }
        tabIndex={0}
        {...scrub<SVGSVGElement>(pick)}
      >
        {gridlines.map((p) => (
          <line key={p} className={frame.grid} x1={LEFT} x2={WIDTH} y1={y(p)} y2={y(p)} />
        ))}
        <path className={`${styles.curve} ${hz ? styles[`hz${hz}`] : styles.system}`} d={path} />
        {share !== null && (
          <>
            <line className={frame.marker} x1={x(share)} x2={x(share)} y1={TOP} y2={TOP + PLOT} />
            <text
              className={frame.hour}
              x={share > 0.8 ? x(share) - 3 : x(share) + 3}
              y={TOP + 9}
              textAnchor={share > 0.8 ? 'end' : 'start'}
            >
              {percent(share)}
            </text>
          </>
        )}
        {gridlines.map((p) => (
          <text key={p} className={frame.gridLabel} x={LEFT - 4} y={y(p) + 3} textAnchor="end">
            {s.chart.yen(p)}
          </text>
        ))}
        {SHARES.map((share) => (
          <text
            key={share}
            className={frame.hour}
            x={x(share)}
            y={height - 4}
            textAnchor={share === 0 ? 'start' : share === 1 ? 'end' : 'middle'}
          >
            {percent(share)}
          </text>
        ))}
      </svg>
      <figcaption>
        <p className={styles.note}>{s.chart.durationKey(d.halfHours.toLocaleString('en-US'), d.from, d.to)}</p>
        <dl className={styles.figures}>
          <dt>{s.chart.mean}</dt>
          <dd>
            {yen(d.mean)} <span className="muted">{s.readout.yenPerKwh}</span>
          </dd>
          <dt>{s.chart.median}</dt>
          <dd>
            {yen(d.median)} <span className="muted">{s.readout.yenPerKwh}</span>
          </dd>
          <dt>{s.chart.topTenth}</dt>
          <dd>
            {yen(d.topTenth)} <span className="muted">{s.readout.yenPerKwh}</span>
          </dd>
          <dt>{s.chart.atFloor}</dt>
          <dd>{percent(d.floorShare)}</dd>
        </dl>
      </figcaption>
    </figure>
  )
}
