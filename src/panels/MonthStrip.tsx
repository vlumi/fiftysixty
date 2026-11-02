import type { PointerEvent } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { Area } from '../regions/areas'
import { areaList } from '../regions/names'
import type { DayTotals, PriceStats } from '../market/daily'
import { SERIES } from '../market/stack'
import { yen } from '../shared/format'
import { priceAxis } from '../shared/scale'
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

/** A priced day of the month with its figures, the picked area's or the system price's. */
export interface MonthPrice {
  date: string
  stats: PriceStats
}

interface Props {
  /** The month's whole recorded days in order. */
  days: readonly MonthDay[]
  /** The month's priced days in order, for the price row under the supply. */
  prices?: readonly MonthPrice[]
  /** The half whose price color the price row takes, or none for the system price. */
  hz?: number | null
  date: string | null
  onPick: (date: string) => void
}

/**
 * The displayed month a day a column, side by side to compare: a bar as tall as the day's supply and banded by the
 * sources as the chart stacks them, and under it the day's price from its lowest half hour to its highest with the mean
 * as a tick, the displayed day marked. The columns are the recorded whole days and the priced days together, so the
 * price row runs on into the days the records have not reached. It is a slider for the pointer: pressing and dragging
 * across it moves the map through the days; the keys keep the page's scheme, Shift and an arrow for a day.
 */
export default function MonthStrip({ days, prices = [], hz = null, date, onPick }: Props) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const supply = new Map(days.map((d) => [d.date, d]))
  const priced = new Map(prices.map((p) => [p.date, p]))
  const dates = [...new Set([...supply.keys(), ...priced.keys()])].sort()
  if (dates.length < 2) return null
  const supplied = (t: DayTotals) => t.generatedMWh + t.storageOutMWh
  const top = Math.max(...days.map((d) => supplied(d.totals)))
  const ceiling = priceAxis(Math.max(...prices.map((p) => p.stats.high.price))).top
  const at = date ? dates.indexOf(date) : -1
  const describe = (d: string) => {
    const day = supply.get(d)
    const price = priced.get(d)
    const parts = [
      day &&
        `${(day.totals.demandMWh / GWH).toFixed(0)} ${s.day.gwh}` +
          (day.missing.length ? `, ${s.day.without(areaList(day.missing, lang))}` : ''),
      price && s.day.meanOf(yen(price.stats.mean)),
    ]
    return `${formatDay(d, lang)}: ${parts.filter(Boolean).join(', ')}`
  }
  const go = (index: number) => {
    const day = dates[Math.max(0, Math.min(dates.length - 1, index))]
    if (day !== date) onPick(day)
  }
  const dayAt = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return Math.floor(((e.clientX - rect.left) / rect.width) * dates.length)
  }
  const range = ({ low, high, mean }: PriceStats) => ({
    bottom: `${(low.price / ceiling) * 100}%`,
    height: `${((high.price - low.price) / ceiling) * 100}%`,
    mean: `${high.price > low.price ? ((mean - low.price) / (high.price - low.price)) * 100 : 0}%`,
  })

  const [year, month] = dates[0].split('-').map(Number)
  return (
    <section className={styles.month} aria-label={s.day.month(year, month)}>
      <h3>{s.day.month(year, month)}</h3>
      <div
        className={styles.bars}
        role="slider"
        tabIndex={0}
        aria-label={s.day.month(year, month)}
        aria-valuemin={1}
        aria-valuemax={dates.length}
        aria-valuenow={at + 1}
        aria-valuetext={at >= 0 ? describe(dates[at]) : undefined}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          go(dayAt(e))
        }}
        onPointerMove={(e) => e.buttons && go(dayAt(e))}
      >
        {dates.map((d) => {
          const day = supply.get(d)
          const price = priced.get(d)
          return (
            <span
              key={d}
              className={day?.missing.length ? `${styles.day} ${styles.partial}` : styles.day}
              aria-current={d === date ? 'date' : undefined}
              title={describe(d)}
            >
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
              {prices.length > 0 && (
                <span className={styles.prices}>
                  {price && (
                    <span
                      className={`${styles.range} ${hz ? styles[`hz${hz}`] : styles.system}`}
                      style={{ bottom: range(price.stats).bottom, height: range(price.stats).height }}
                    >
                      <span className={styles.mean} style={{ bottom: range(price.stats).mean }} />
                    </span>
                  )}
                </span>
              )}
            </span>
          )
        })}
      </div>
      <div className={styles.ends} aria-hidden="true">
        <span>{Number(dates[0].slice(8))}</span>
        <span>{Number(dates[dates.length - 1].slice(8))}</span>
      </div>
    </section>
  )
}
