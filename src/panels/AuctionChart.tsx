import { useStrings } from '../i18n/useStrings'
import { turnover, type SpotSlot } from '../market/jepx'
import { largeYen } from '../shared/format'
import DayChart from './DayChart'
import frame from './DayChart.module.css'
import styles from './AuctionChart.module.css'
import { LEFT, slotX, TOP, WIDTH } from './slotAxis'

const PLOT = 96
/** Energy over a half hour in kWh as the power it averages, in GW. */
const gw = (kwh: number) => (kwh * 2) / 1e6

interface Props {
  day: readonly SpotSlot[]
  slot: number
  onSlot: (slot: number) => void
  /** Whether to label the hours; left off when the supply chart follows directly under. */
  hours?: boolean
}

/**
 * The auction behind the system price, in the day charts' frame: what was offered, what was asked and what cleared
 * each half hour, system-wide, as three lines with the gap between the bids shaded, since when far more is offered
 * than asked the price falls to the floor. The key carries the half hour's figures, and what it cleared came to in yen.
 */
export default function AuctionChart({ day, slot, onSlot, hours }: Props) {
  const s = useStrings()
  const max = Math.max(...day.flatMap((d) => [gw(d.sellKWh), gw(d.buyKWh)]))
  // About five gridlines whatever the scale, as the supply chart's; the unit on the zero label alone, so a hundred fits the gutter.
  const step = [5, 10, 20, 50].find((g) => max / g <= 5) ?? 100
  const top = Math.ceil(max / step) * step
  const y = (v: number) => TOP + (1 - v / top) * PLOT
  const points = (at: (d: SpotSlot) => number, slots: readonly SpotSlot[]) =>
    slots.map((d) => `${slotX(d.slot).toFixed(1)},${y(gw(at(d))).toFixed(1)}`)
  const line = (at: (d: SpotSlot) => number) => `M${points(at, day).join('L')}`
  const gap = `M${points((d) => d.sellKWh, day).join('L')}L${points((d) => d.buyKWh, [...day].reverse()).join('L')}Z`
  const gridlines = []
  for (let v = 0; v <= top; v += step) gridlines.push(v)
  const at = day.find((d) => d.slot === slot)
  const lines = [
    { key: 'offered', name: s.chart.offered, className: styles.offered, kwh: at?.sellKWh },
    { key: 'asked', name: s.chart.asked, className: styles.asked, kwh: at?.buyKWh },
    { key: 'cleared', name: s.chart.cleared, className: styles.cleared, kwh: at?.volumeKWh },
  ] as const

  return (
    <figure className={frame.figure}>
      <DayChart label={s.chart.auction} plot={PLOT} slot={slot} onSlot={onSlot} hours={hours}>
        {gridlines.map((v) => (
          <line key={v} className={frame.grid} x1={LEFT} x2={WIDTH} y1={y(v)} y2={y(v)} />
        ))}
        <path className={styles.gap} d={gap} />
        <path className={styles.offered} d={line((d) => d.sellKWh)}>
          <title>{s.chart.offered}</title>
        </path>
        <path className={styles.asked} d={line((d) => d.buyKWh)}>
          <title>{s.chart.asked}</title>
        </path>
        <path className={styles.cleared} d={line((d) => d.volumeKWh)}>
          <title>{s.chart.cleared}</title>
        </path>
        {gridlines.map((v) => (
          <text key={v} className={frame.gridLabel} x={LEFT - 4} y={y(v) + 3} textAnchor="end">
            {v === 0 ? `0 ${s.chart.gw}` : v}
          </text>
        ))}
      </DayChart>
      <figcaption className={styles.legend}>
        {lines.map((l) => (
          <span key={l.key}>
            <span className={`${styles.lineKey} ${l.className}`} />
            {l.name}
            {l.kwh !== undefined && (
              <span className={styles.figure}>
                {gw(l.kwh).toFixed(1)} {s.chart.gw}
              </span>
            )}
          </span>
        ))}
        {at && (
          <span>
            {s.chart.turnover}
            <span className={styles.figure}>
              {largeYen(turnover([at]), s.readout.largeYen)} {s.readout.largeYen.unit}
            </span>
          </span>
        )}
      </figcaption>
    </figure>
  )
}
