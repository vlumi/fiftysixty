import type { ReactNode } from 'react'
import { SLOTS } from '../market/jepx'
import { slotRange } from '../time/slots'
import styles from './DayChart.module.css'
import { LEFT, SPAN, slotAtX, slotX, TOP, WIDTH } from './slotAxis'

/** The row of hour labels along the foot. */
const HOURS = 16

interface Props {
  label: string
  /** The plot's height under the top margin; the hours, when drawn, sit under that. */
  plot: number
  slot: number
  onSlot: (slot: number) => void
  /** Whether to label the hours along the foot; left off when another day chart follows directly under. */
  hours?: boolean
  children: ReactNode
}

/**
 * The SVG a day chart draws in, and itself a slider over the 48 half hours: pointing or dragging moves the half hour,
 * the displayed one is marked over whatever is drawn, and with it focused the page's arrow keys step it, so the readout
 * beside it is the tooltip.
 */
export default function DayChart({ label, plot, slot, onSlot, hours = true, children }: Props) {
  const height = TOP + plot + (hours ? HOURS : TOP)
  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="slider"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={SLOTS}
      aria-valuenow={slot}
      aria-valuetext={slotRange(slot)}
      tabIndex={0}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        onSlot(slotAtX(e.clientX, e.currentTarget.getBoundingClientRect()))
      }}
      onPointerMove={(e) => e.buttons && onSlot(slotAtX(e.clientX, e.currentTarget.getBoundingClientRect()))}
    >
      {children}
      <line className={styles.marker} x1={slotX(slot)} x2={slotX(slot)} y1={TOP} y2={TOP + plot} />
      {hours &&
        [0, 6, 12, 18, 24].map((h) => (
          <text
            key={h}
            className={styles.hour}
            x={LEFT + (h / 24) * SPAN}
            y={height - 4}
            textAnchor={h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}
          >
            {h}
          </text>
        ))}
    </svg>
  )
}
