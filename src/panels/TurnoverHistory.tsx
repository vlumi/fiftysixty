import { useRef, type PointerEvent } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { HistoryDay } from '../market/history'
import { largeYen } from '../shared/format'
import { roundTop } from '../shared/scale'
import { scrub } from '../shared/scrub'
import { useElementSize } from '../shared/useElementSize'
import { useApp } from '../store'
import { formatDay } from '../time/days'
import { cellAt } from './heatmap'
import MonthTicks from './MonthTicks'
import styles from './TurnoverHistory.module.css'

/**
 * The day-ahead turnover over time under the price history and on its days, a day a column from zero to a round
 * figure above the most turned over, in the language's large unit; the displayed day marked and its figure in the
 * key. A slider over the days like the heatmap above it: pressing or dragging sets the day.
 */
export default function TurnoverHistory({
  days,
  date,
  onPick,
}: {
  days: readonly HistoryDay[]
  date: string | null
  onPick: (date: string) => void
}) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const plot = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(plot)
  const n = days.length
  if (!n) return null

  const unit = s.readout.largeYen
  const top = roundTop(Math.max(...days.map((d) => d.turnover)) / unit.per)
  const columns = days.map((d, i) => `V${(1 - d.turnover / unit.per / top).toFixed(4)}H${i + 1}`)
  const at = date ? days.findIndex((d) => d.date === date) : -1
  const figure = at >= 0 ? largeYen(days[at].turnover, unit) : null
  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onPick(days[cellAt((e.clientX - rect.left) / rect.width, 0, n).index].date)
  }

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <div className={styles.scale} aria-hidden="true">
          <span style={{ top: 0 }}>{top.toLocaleString('en-US')}</span>
          <span style={{ top: '100%' }}>0</span>
        </div>
        <div
          ref={plot}
          className={styles.plot}
          role="slider"
          tabIndex={0}
          aria-label={s.chart.turnoverHistory}
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={at + 1}
          aria-valuetext={figure ? `${formatDay(date!, lang)}: ${figure} ${unit.unit}` : undefined}
          {...scrub<HTMLDivElement>(pick)}
        >
          <svg className={styles.columns} viewBox={`0 0 ${n} 1`} preserveAspectRatio="none">
            <path d={`M0,1${columns.join('')}V1Z`} />
          </svg>
          {at >= 0 && <span className={styles.column} style={{ left: `${((at + 0.5) / n) * 100}%` }} />}
        </div>
        <MonthTicks className={styles.months} dates={days.map((d) => d.date)} width={width} />
      </div>
      <figcaption className={styles.legend}>
        <span>{s.chart.turnoverKey(unit.unit)}</span>
        {figure && <span className={styles.value}>{figure}</span>}
      </figcaption>
    </figure>
  )
}
