import type { PointerEvent } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { Area } from '../regions/areas'
import { areaList } from '../regions/names'
import type { DayTotals } from '../market/daily'
import { SERIES } from '../market/stack'
import { yen } from '../shared/format'
import { priceAxis } from '../shared/scale'
import { useApp } from '../store'
import { formatDay } from '../time/days'
import styles from './MonthStrip.module.css'
import { scrub } from '../shared/scrub'

const GWH = 1000

/** A whole day of the month with its totals, and for all Japan the areas left out of them. */
export interface MonthDay {
  date: string
  totals: DayTotals
  missing: readonly Area[]
}

/** A priced day of the month: its lowest and highest half hour, and the mean, or for a half of the grid the price weighted by demand where the records allow it. */
export interface MonthPrice {
  date: string
  low: number
  high: number
  mean: number | null
}

interface Props {
  /** The month's whole recorded days in order. */
  days: readonly MonthDay[]
  /** The month's priced days in order, for the price row under the supply. */
  prices?: readonly MonthPrice[]
  /** The half whose price color the price row takes, or none for the system price. */
  hz?: number | null
  /** Whether the price row's ticks are prices weighted by demand, a half's, rather than means. */
  weighted?: boolean
  date: string | null
  onPick: (date: string) => void
}

/**
 * The displayed month a day a column, side by side to compare: the day's price from its lowest half hour to its
 * highest with the mean as a tick, and under it, as the supply chart stands under the price curve, a bar as tall as
 * the day's supply and banded by the sources as the chart stacks them, the displayed day marked. Every day of the
 * month has its column, the ones with neither a record nor a price left blank, so a column keeps its width as the
 * month fills and the price row runs on into the days the records have not reached. It is a slider for the pointer:
 * pressing and dragging across it moves the map through the days with data, a blank snapping to the nearest; the keys
 * keep the page's scheme, Shift and an arrow for a day.
 */
export default function MonthStrip({ days, prices = [], hz = null, weighted = false, date, onPick }: Props) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const supply = new Map(days.map((d) => [d.date, d]))
  const priced = new Map(prices.map((p) => [p.date, p]))
  const dates = [...new Set([...supply.keys(), ...priced.keys()])].sort()
  if (dates.length < 2) return null
  const [year, month] = dates[0].split('-').map(Number)
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const all = Array.from({ length }, (_, i) => `${dates[0].slice(0, 8)}${String(i + 1).padStart(2, '0')}`)
  const indexOf = (d: string) => Number(d.slice(8)) - 1
  const supplied = (t: DayTotals) => t.generatedMWh + t.storageOutMWh
  const top = Math.max(...days.map((d) => supplied(d.totals)))
  const ceiling = priceAxis(Math.max(...prices.map((p) => p.high))).top
  const at = date && all.includes(date) ? indexOf(date) : -1
  const describe = (d: string) => {
    const day = supply.get(d)
    const price = priced.get(d)
    const parts = [
      day &&
        `${(day.totals.demandMWh / GWH).toFixed(0)} ${s.day.gwh}` +
          (day.missing.length ? `, ${s.day.without(areaList(day.missing, lang))}` : ''),
      price &&
        (price.mean === null
          ? s.day.spreadOf(yen(price.low), yen(price.high))
          : (weighted ? s.day.weightedOf : s.day.meanOf)(yen(price.mean))),
    ].filter(Boolean)
    return parts.length ? `${formatDay(d, lang)}: ${parts.join(', ')}` : formatDay(d, lang)
  }
  const go = (index: number) => {
    const day = dates.reduce((best, d) => (Math.abs(indexOf(d) - index) < Math.abs(indexOf(best) - index) ? d : best))
    if (day !== date) onPick(day)
  }
  const dayAt = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return Math.floor(((e.clientX - rect.left) / rect.width) * length)
  }
  const range = ({ low, high, mean }: MonthPrice) => ({
    bottom: `${(low / ceiling) * 100}%`,
    height: `${((high - low) / ceiling) * 100}%`,
    mean: `${mean !== null && high > low ? ((mean - low) / (high - low)) * 100 : 0}%`,
  })

  return (
    <section className={styles.month} aria-label={s.day.month(year, month)}>
      <h3>{s.day.month(year, month)}</h3>
      <div
        className={styles.bars}
        role="slider"
        tabIndex={0}
        aria-label={s.day.month(year, month)}
        aria-valuemin={1}
        aria-valuemax={length}
        aria-valuenow={at + 1}
        aria-valuetext={at >= 0 ? describe(all[at]) : undefined}
        {...scrub<HTMLDivElement>((e) => go(dayAt(e)))}
      >
        {all.map((d) => {
          const day = supply.get(d)
          const price = priced.get(d)
          return (
            <span
              key={d}
              className={day?.missing.length ? `${styles.day} ${styles.partial}` : styles.day}
              aria-current={d === date ? 'date' : undefined}
              title={supply.has(d) || priced.has(d) ? describe(d) : undefined}
            >
              {prices.length > 0 && (
                <span className={styles.prices}>
                  {price && (
                    <span
                      className={`${styles.range} ${hz ? styles[`hz${hz}`] : styles.system}`}
                      style={{ bottom: range(price).bottom, height: range(price).height }}
                    >
                      {price.mean !== null && <span className={styles.mean} style={{ bottom: range(price).mean }} />}
                    </span>
                  )}
                </span>
              )}
              {days.length > 0 && (
                <span className={styles.supply}>
                  {day && (
                    <span className={styles.stack} style={{ height: `${(supplied(day.totals) / top) * 100}%` }}>
                      <span style={{ flexGrow: day.totals.storageOutMWh, background: 'var(--src-storage)' }} />
                      {[...SERIES].reverse().map((x) => (
                        <span key={x} style={{ flexGrow: day.totals.bySeries[x], background: `var(--src-${x})` }} />
                      ))}
                    </span>
                  )}
                </span>
              )}
            </span>
          )
        })}
      </div>
      <div className={styles.ends} aria-hidden="true">
        <span>1</span>
        <span>{length}</span>
      </div>
    </section>
  )
}
