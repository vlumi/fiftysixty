import { useStrings } from '../i18n/useStrings'
import type { PricedArea, SpotSlot } from '../market/jepx'
import { AREA_BY_ID, PRICED_AREAS } from '../regions/areas'
import { priceAxis } from '../shared/scale'
import { useApp } from '../store'
import DayChart from './DayChart'
import frame from './DayChart.module.css'
import styles from './PriceChart.module.css'
import { LEFT, slotX, TOP, WIDTH } from './slotAxis'

const PLOT = 96
const AREAS = PRICED_AREAS.map((a) => a.id as PricedArea)

interface Props {
  day: readonly SpotSlot[]
  /** The area whose price leads, or none for the system price under every area's. */
  area: PricedArea | null
  slot: number
  onSlot: (slot: number) => void
  /** Whether to label the hours; left off when the supply chart follows directly under. */
  hours?: boolean
}

/**
 * The day's prices in the day charts' frame: the system price as a thin dashed line in the text color, and over it the
 * picked area's price in its half's hue, or every area's with none picked, so the day forks where the market split.
 */
export default function PriceChart({ day, area, slot, onSlot, hours }: Props) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const areas = area ? [area] : AREAS
  const { top, step } = priceAxis(Math.max(...day.flatMap((d) => [d.systemPrice, ...areas.map((a) => d.areaPrice[a])])))
  const y = (price: number) => TOP + (1 - price / top) * PLOT
  const line = (at: (d: SpotSlot) => number) =>
    `M${day.map((d) => `${slotX(d.slot).toFixed(1)},${y(at(d)).toFixed(1)}`).join('L')}`
  const gridlines = []
  for (let price = 0; price <= top; price += step) gridlines.push(price)
  const name = (a: PricedArea) => (lang === 'ja' ? AREA_BY_ID[a].ja : AREA_BY_ID[a].name)
  const hue = (a: PricedArea) => styles[`hz${AREA_BY_ID[a].hz}`]

  return (
    <figure className={frame.figure}>
      <DayChart label={s.chart.price} plot={PLOT} slot={slot} onSlot={onSlot} hours={hours}>
        {gridlines.map((price) => (
          <line key={price} className={frame.grid} x1={LEFT} x2={WIDTH} y1={y(price)} y2={y(price)} />
        ))}
        {areas.map((a) => (
          <path key={a} className={`${area ? styles.area : styles.areas} ${hue(a)}`} d={line((d) => d.areaPrice[a])}>
            <title>{name(a)}</title>
          </path>
        ))}
        <path className={styles.system} d={line((d) => d.systemPrice)}>
          <title>{s.readout.systemPrice}</title>
        </path>
        {gridlines.map((price) => (
          <text key={price} className={frame.gridLabel} x={LEFT - 4} y={y(price) + 3} textAnchor="end">
            {s.chart.yen(price)}
          </text>
        ))}
      </DayChart>
      <figcaption className={styles.legend}>
        {area ? (
          <span>
            <span className={`${styles.areaKey} ${hue(area)}`} />
            {name(area)}
          </span>
        ) : (
          ([50, 60] as const).map((hz) => (
            <span key={hz}>
              <span className={`${styles.areaKey} ${styles[`hz${hz}`]}`} />
              {s.readout.hz(hz)}
            </span>
          ))
        )}
        <span>
          <span className={styles.systemKey} />
          {s.readout.systemPrice}
        </span>
      </figcaption>
    </figure>
  )
}
