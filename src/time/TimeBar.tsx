import { SLOTS } from '../market/jepx'
import { slotRange } from './slots'
import styles from './TimeBar.module.css'

interface Props {
  date: string | null
  /** The delivery days there are prices for, sorted. */
  days: readonly string[]
  slot: number
  onDate: (date: string) => void
  onSlot: (slot: number) => void
}

/** The day and its 48 half hours; a controlled row of native inputs, so it scrubs and takes the keyboard for free. */
export default function TimeBar({ date, days, slot, onDate, onSlot }: Props) {
  return (
    <div className={styles.bar} data-timebar>
      <input
        type="date"
        aria-label="Delivery day"
        value={date ?? ''}
        min={days[0]}
        max={days.at(-1)}
        disabled={!date}
        onChange={(e) => e.target.value && onDate(e.target.value)}
      />
      <input
        type="range"
        aria-label="Half hour"
        min={1}
        max={SLOTS}
        step={1}
        value={slot}
        onChange={(e) => onSlot(Number(e.target.value))}
      />
      <output>{slotRange(slot)} JST</output>
    </div>
  )
}
