import { useApp } from '../store'
import { labeled, monthStarts } from './heatmap'
import styles from './MonthTicks.module.css'

/** Room for a month's label along the foot, in CSS pixels. */
const LABEL_PX = 30

/** A tick where a month begins along the foot of a chart over `dates`, its name beside it where there is room and the year in place of January. */
export default function MonthTicks({
  dates,
  width,
  className,
}: {
  dates: readonly string[]
  /** The foot's width in CSS pixels, for how many labels fit. */
  width: number
  className?: string
}) {
  const lang = useApp((x) => x.lang)
  const n = dates.length
  const starts = monthStarts(dates)
  const january = (i: number) => dates[i].slice(5, 7) === '01'
  const named = new Set(labeled(starts, width ? (LABEL_PX * n) / width : 0, starts.filter(january)))
  const label = (d: string) => {
    const [year, month] = d.split('-').map(Number)
    if (month === 1) return lang === 'ja' ? `${year}年` : `${year}`
    return new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', { month: 'short', timeZone: 'UTC' }).format(
      Date.UTC(year, month - 1, 1),
    )
  }
  return (
    <div className={className ? `${styles.months} ${className}` : styles.months} aria-hidden="true">
      {starts.map((i) => (
        <span key={i} style={{ left: `${(i / n) * 100}%` }}>
          {named.has(i) ? label(dates[i]) : ''}
        </span>
      ))}
    </div>
  )
}
