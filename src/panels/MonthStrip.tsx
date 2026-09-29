import type { PointerEvent } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { Area } from '../regions/areas'
import { areaList } from '../regions/names'
import type { DayTotals } from '../market/daily'
import { SERIES } from '../market/stack'
import { useApp } from '../store'
import { formatDay } from '../time/days'
import styles from './MonthStrip.module.css'

const GWH = 1000

/** A whole day of the month with its totals, and for all Japan the areas left out of them. */
export interface MonthDay {
  date: string
  totals: DayTotals
  missing: readonly Area[]
}

interface Props {
  /** The month's whole days in order. */
  days: readonly MonthDay[]
  date: string | null
  onPick: (date: string) => void
}

/**
 * The displayed month a day a bar, side by side to compare: each bar as tall as the day's supply and banded by the
 * sources as the chart stacks them, the displayed day marked. It is a slider for the pointer: pressing and dragging across
 * it moves the map through the days; the keys keep the page's scheme, Shift and an arrow for a day.
 */
export default function MonthStrip({ days, date, onPick }: Props) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  if (days.length < 2) return null
  const supplied = (t: DayTotals) => t.generatedMWh + t.storageOutMWh
  const top = Math.max(...days.map((d) => supplied(d.totals)))
  const at = days.findIndex((d) => d.date === date)
  const describe = ({ date: d, totals, missing }: MonthDay) =>
    `${formatDay(d, lang)}: ${(totals.demandMWh / GWH).toFixed(0)} ${s.day.gwh}` +
    (missing.length ? `, ${s.day.without(areaList(missing, lang))}` : '')
  const go = (index: number) => {
    const day = days[Math.max(0, Math.min(days.length - 1, index))]
    if (day.date !== date) onPick(day.date)
  }
  const dayAt = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return Math.floor(((e.clientX - rect.left) / rect.width) * days.length)
  }

  const [year, month] = days[0].date.split('-').map(Number)
  return (
    <section className={styles.month} aria-label={s.day.month(year, month)}>
      <h3>{s.day.month(year, month)}</h3>
      <div
        className={styles.bars}
        role="slider"
        tabIndex={0}
        aria-label={s.day.month(year, month)}
        aria-valuemin={1}
        aria-valuemax={days.length}
        aria-valuenow={at + 1}
        aria-valuetext={at >= 0 ? describe(days[at]) : undefined}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          go(dayAt(e))
        }}
        onPointerMove={(e) => e.buttons && go(dayAt(e))}
      >
        {days.map((d) => (
          <span
            key={d.date}
            className={d.missing.length ? `${styles.day} ${styles.partial}` : styles.day}
            aria-current={d.date === date ? 'date' : undefined}
            title={describe(d)}
          >
            <span className={styles.stack} style={{ height: `${(supplied(d.totals) / top) * 100}%` }}>
              <span style={{ flexGrow: d.totals.storageOutMWh, background: 'var(--src-storage)' }} />
              {[...SERIES].reverse().map((x) => (
                <span key={x} style={{ flexGrow: d.totals.bySeries[x], background: `var(--src-${x})` }} />
              ))}
            </span>
          </span>
        ))}
      </div>
      <div className={styles.ends} aria-hidden="true">
        <span>{Number(days[0].date.slice(8))}</span>
        <span>{Number(days[days.length - 1].date.slice(8))}</span>
      </div>
    </section>
  )
}
