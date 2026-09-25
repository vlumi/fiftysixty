import { SLOTS } from '../market/jepx'
import { jstDate, relation } from './days'
import { slotRange } from './slots'
import styles from './TimeBar.module.css'

interface Props {
  date: string | null
  /** The delivery days there are prices for, sorted. */
  days: readonly string[]
  slot: number
  now: Date
  onDate: (date: string) => void
  onSlot: (slot: number) => void
}

/**
 * The day and its 48 half hours: a controlled row of native inputs, so it scrubs and takes the keyboard for free, with
 * a step to the priced day before and after, a jump to today, and a word for where the half hour stands; on today,
 * whether it is now or still ahead, since the price is known before the record.
 */
export default function TimeBar({ date, days, slot, now, onDate, onSlot }: Props) {
  const at = date ? days.indexOf(date) : -1
  const previous = at > 0 ? days[at - 1] : undefined
  const next = at >= 0 && at < days.length - 1 ? days[at + 1] : undefined
  const today = jstDate(now)
  const stands = date ? relation(date, slot, now) : null
  return (
    <div className={styles.bar} data-timebar>
      <button aria-label="Previous day" disabled={!previous} onClick={() => previous && onDate(previous)}>
        ‹
      </button>
      <input
        type="date"
        aria-label="Delivery day"
        value={date ?? ''}
        min={days[0]}
        max={days.at(-1)}
        disabled={!date}
        onChange={(e) => e.target.value && onDate(e.target.value)}
      />
      <button aria-label="Next day" disabled={!next} onClick={() => next && onDate(next)}>
        ›
      </button>
      <button disabled={date === today || !days.includes(today)} onClick={() => onDate(today)}>
        Today
      </button>
      <input
        type="range"
        aria-label="Half hour"
        min={1}
        max={SLOTS}
        step={1}
        value={slot}
        onChange={(e) => onSlot(Number(e.target.value))}
      />
      <output>
        {stands && <span className={styles[stands.when]}>{stands.day}</span>} {slotRange(slot)} JST
        {stands?.day === 'Today' && stands.when === 'now' && <span className={styles.now}> · now</span>}
        {stands?.day === 'Today' && stands.when === 'ahead' && <span className="muted"> · ahead</span>}
      </output>
    </div>
  )
}
