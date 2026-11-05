import { useEffect, useRef, type PointerEvent } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { HistoryDay } from '../market/history'
import { SLOTS } from '../market/jepx'
import { AREA_BY_ID, type PricedArea } from '../regions/areas'
import { areaName } from '../regions/names'
import { yen } from '../shared/format'
import { PALETTES } from '../shared/palette'
import { cssRgb, PRICE_DOMAIN } from '../shared/scale'
import { useElementSize } from '../shared/useElementSize'
import { useTheme } from '../shared/useTheme'
import { useApp } from '../store'
import { formatDay } from '../time/days'
import { slotRange } from '../time/slots'
import { cellAt, heatmapPixels } from './heatmap'
import MonthTicks from './MonthTicks'
import styles from './PriceHistory.module.css'
import { scrub } from '../shared/scrub'

const HOURS = [0, 6, 12, 18, 24]

interface Props {
  days: readonly HistoryDay[]
  /** The area whose price is drawn, or none for the system price. */
  area: PricedArea | null
  date: string | null
  slot: number
  onPick: (date: string, slot: number) => void
}

/**
 * The price history as a heatmap: a day a column across, the 48 half hours down from midnight, each cell in the map's
 * own ramp over its fixed domain, so a cell means what the map's fill means, the picked area's half or the neutral
 * ramp for the system price. Drawn on a canvas a device pixel a column, a year of days fitting the panel. It is a
 * slider over the days for the pointer in two dimensions: pressing a cell sets the day and the half hour, which the
 * crosshair marks; the keys keep the page's scheme.
 */
export default function PriceHistory({ days, area, date, slot, onPick }: Props) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const ramp = PALETTES[useTheme()].price[area ? AREA_BY_ID[area].hz : 'system']
  const plot = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const { width } = useElementSize(plot)
  const n = days.length

  useEffect(() => {
    if (!width || !n) return
    const target = canvas.current?.getContext('2d')
    if (!target) return
    const columns = Math.round(width * (window.devicePixelRatio || 1))
    target.canvas.width = columns
    target.canvas.height = SLOTS
    const image = target.createImageData(columns, SLOTS)
    image.data.set(
      heatmapPixels(
        days.map((d) => d.prices),
        ramp,
        columns,
      ),
    )
    target.putImageData(image, 0, 0)
  }, [days, ramp, width, n])

  if (!n) return null
  const at = date ? days.findIndex((d) => d.date === date) : -1
  const price = at >= 0 ? days[at].prices[slot - 1] : NaN
  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const cell = cellAt((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height, n)
    onPick(days[cell.index].date, cell.slot)
  }
  const name = area ? areaName(area, lang) : s.readout.systemPrice
  const [lo, hi] = PRICE_DOMAIN

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <div className={styles.hours} aria-hidden="true">
          {HOURS.map((h) => (
            <span key={h} style={{ top: `${(h / 24) * 100}%` }}>
              {h}
            </span>
          ))}
        </div>
        <div
          ref={plot}
          className={styles.plot}
          role="slider"
          tabIndex={0}
          aria-label={s.chart.history}
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={at + 1}
          aria-valuetext={
            at >= 0 ? `${formatDay(date!, lang)} ${slotRange(slot)}: ${yen(price)} ${s.readout.yenPerKwh}` : undefined
          }
          {...scrub<HTMLDivElement>(pick)}
        >
          <canvas ref={canvas} className={styles.canvas} />
          {at >= 0 && (
            <>
              <span className={styles.column} style={{ left: `${((at + 0.5) / n) * 100}%` }} />
              <span className={styles.row} style={{ top: `${((slot - 0.5) / SLOTS) * 100}%` }} />
            </>
          )}
        </div>
        <MonthTicks className={styles.months} dates={days.map((d) => d.date)} width={width} />
      </div>
      <figcaption className={styles.legend}>
        <span>{name}</span>
        <span
          className={styles.ramp}
          style={{ background: `linear-gradient(to right, ${ramp.map(cssRgb).join(', ')})` }}
        />
        <span className={styles.ends}>
          <span>{lo}</span>
          <span>
            {hi}+ {s.readout.yenPerKwh}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}
