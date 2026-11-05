import { useEffect, useMemo, useRef, type PointerEvent } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { SplitHistory as Splits } from '../market/splits'
import type { Interconnector } from '../regions/interconnectors'
import { areaName } from '../regions/names'
import { PALETTES } from '../shared/palette'
import { percent } from '../shared/format'
import { cssRgb } from '../shared/scale'
import { scrub } from '../shared/scrub'
import { useElementSize } from '../shared/useElementSize'
import { useTheme } from '../shared/useTheme'
import { useApp } from '../store'
import { formatDay } from '../time/days'
import { heatmapPixels } from './heatmap'
import MonthTicks from './MonthTicks'
import styles from './SplitHistory.module.css'

/** A share runs from none of the day's half hours to all of them. */
const SHARE: readonly [number, number] = [0, 1]

/**
 * The market splits over time as a heatmap under the price history, a line a row and a day a column, each cell the
 * share of the day's half hours in which the line's two ends priced apart, from the surface to the split line's own
 * color; the displayed day marked. Drawn on a canvas like the prices, a device pixel a column, and like them a slider
 * over the days: pressing or dragging sets the day.
 */
export default function SplitHistory({
  splits,
  date,
  onPick,
}: {
  splits: Splits
  date: string | null
  onPick: (date: string) => void
}) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const palette = PALETTES[useTheme()]
  const ramp = useMemo(() => [palette.price.system[0], palette.accent], [palette])
  const plot = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const { width } = useElementSize(plot)
  const { lines, days } = splits
  const n = days.length

  useEffect(() => {
    if (!width || !n || !lines.length) return
    const target = canvas.current?.getContext('2d')
    if (!target) return
    const columns = Math.round(width * (window.devicePixelRatio || 1))
    target.canvas.width = columns
    target.canvas.height = lines.length
    const image = target.createImageData(columns, lines.length)
    image.data.set(
      heatmapPixels(
        days.map((d) => d.shares),
        ramp,
        columns,
        SHARE,
      ),
    )
    target.putImageData(image, 0, 0)
  }, [days, lines.length, ramp, width, n])

  if (!n || !lines.length) return null
  const at = date ? days.findIndex((d) => d.date === date) : -1
  const name = (l: Interconnector) => `${areaName(l.ends[0], lang)}–${areaName(l.ends[1], lang)}`
  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onPick(days[Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * n)))].date)
  }
  const describe = (i: number) =>
    `${formatDay(days[i].date, lang)}: ${lines.map((l, k) => `${name(l)} ${percent(days[i].shares[k])}`).join(', ')}`

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <div className={styles.lines} aria-hidden="true">
          {lines.map((l) => (
            <span key={l.id}>{name(l)}</span>
          ))}
        </div>
        <div
          ref={plot}
          className={styles.plot}
          role="slider"
          tabIndex={0}
          aria-label={s.chart.splits}
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={at + 1}
          aria-valuetext={at >= 0 ? describe(at) : undefined}
          {...scrub<HTMLDivElement>(pick)}
        >
          <canvas ref={canvas} className={styles.canvas} />
          {at >= 0 && <span className={styles.column} style={{ left: `${((at + 0.5) / n) * 100}%` }} />}
        </div>
        <MonthTicks className={styles.months} dates={days.map((d) => d.date)} width={width} />
      </div>
      <figcaption className={styles.legend}>
        <span>{s.chart.splitsKey}</span>
        <span
          className={styles.ramp}
          style={{ background: `linear-gradient(to right, ${ramp.map(cssRgb).join(', ')})` }}
        />
        <span className={styles.ends}>
          <span>0%</span>
          <span>100%</span>
        </span>
      </figcaption>
    </figure>
  )
}
