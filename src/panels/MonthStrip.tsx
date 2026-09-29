import { useStrings } from '../i18n/useStrings'
import type { DayTotals } from '../market/daily'
import { SERIES } from '../market/stack'
import { useApp } from '../store'
import { formatDay } from '../time/days'
import styles from './MonthStrip.module.css'

const GWH = 1000

interface Props {
  /** The month's whole days in order, each with its totals. */
  days: readonly { date: string; totals: DayTotals }[]
  date: string | null
  onPick: (date: string) => void
}

/**
 * The displayed month a day a bar, side by side to compare: each bar as tall as the day's demand and banded by the
 * sources as the chart stacks them, the displayed day marked; a tap takes the map to that day.
 */
export default function MonthStrip({ days, date, onPick }: Props) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  if (days.length < 2) return null
  const supplied = (t: DayTotals) => t.generatedMWh + t.storageOutMWh
  const top = Math.max(...days.map((d) => supplied(d.totals)))
  return (
    <section className={styles.month} aria-label={s.day.month}>
      <h3>{s.day.month}</h3>
      <div className={styles.bars}>
        {days.map(({ date: d, totals }) => (
          <button
            key={d}
            className={styles.day}
            aria-current={d === date ? 'date' : undefined}
            aria-label={`${formatDay(d, lang)}: ${(totals.demandMWh / GWH).toFixed(0)} ${s.day.gwh}`}
            title={`${formatDay(d, lang)}: ${(totals.demandMWh / GWH).toFixed(0)} ${s.day.gwh}`}
            onClick={() => onPick(d)}
          >
            <span className={styles.stack} style={{ height: `${(supplied(totals) / top) * 100}%` }}>
              <span style={{ flexGrow: totals.storageOutMWh, background: 'var(--src-storage)' }} />
              {[...SERIES].reverse().map((x) => (
                <span key={x} style={{ flexGrow: totals.bySeries[x], background: `var(--src-${x})` }} />
              ))}
            </span>
          </button>
        ))}
      </div>
      <div className={styles.ends} aria-hidden="true">
        <span>{Number(days[0].date.slice(8))}</span>
        <span>{Number(days[days.length - 1].date.slice(8))}</span>
      </div>
    </section>
  )
}
