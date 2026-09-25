import { useRef } from 'react'
import { useStrings } from '../i18n/useStrings'
import { useApp } from '../store'
import { SLOTS } from '../market/jepx'
import type { Story } from '../market/stories'
import { formatDay, jstDate, relation, slotNow } from './days'
import { slotRange } from './slots'
import styles from './TimeBar.module.css'

interface Props {
  date: string | null
  /** The delivery days there are prices for, sorted. */
  days: readonly string[]
  slot: number
  now: Date
  playing: boolean
  /** Days found in the data, to jump to. */
  stories: readonly Story[]
  onDate: (date: string) => void
  onSlot: (slot: number) => void
  onPlay: () => void
}

/**
 * The day and its 48 half hours: a controlled row of native inputs, so it scrubs and takes the keyboard for free, with
 * a step to the priced day before and after, the day in words in the reader's language over the native picker, a jump
 * to the half hour under way or to a day the data singled out, play
 * through the day at four half hours a second, and a word for where the half hour stands; on today,
 * whether it is now or still ahead, since the price is known before the record.
 */
export default function TimeBar({ date, days, slot, now, playing, stories, onDate, onSlot, onPlay }: Props) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const picker = useRef<HTMLInputElement>(null)
  const at = date ? days.indexOf(date) : -1
  const previous = at > 0 ? days[at - 1] : undefined
  const next = at >= 0 && at < days.length - 1 ? days[at + 1] : undefined
  const today = jstDate(now)
  const stands = date ? relation(date, slot, now) : null
  const dayWord =
    stands === null
      ? ''
      : stands.offset === 0
        ? s.time.today
        : stands.offset === -1
          ? s.time.yesterday
          : stands.offset === 1
            ? s.time.tomorrow
            : stands.offset < 0
              ? s.time.daysAgo(-stands.offset)
              : s.time.daysAhead(stands.offset)
  return (
    <div className={styles.bar} data-timebar>
      <button aria-label={s.time.previousDay} disabled={!previous} onClick={() => previous && onDate(previous)}>
        ‹
      </button>
      <span className={styles.date}>
        <button
          className={styles.dateWords}
          disabled={!date}
          onClick={() => (picker.current?.showPicker ? picker.current.showPicker() : picker.current?.focus())}
        >
          {date ? formatDay(date, lang) : '…'}
        </button>
        <input
          ref={picker}
          type="date"
          aria-label={s.time.day}
          value={date ?? ''}
          min={days[0]}
          max={days.at(-1)}
          disabled={!date}
          onChange={(e) => days.includes(e.target.value) && onDate(e.target.value)}
        />
      </span>
      <button aria-label={s.time.nextDay} disabled={!next} onClick={() => next && onDate(next)}>
        ›
      </button>
      <button
        disabled={!days.includes(today) || (date === today && slot === slotNow(now))}
        onClick={() => {
          onDate(today)
          onSlot(slotNow(now))
        }}
      >
        {s.time.now}
      </button>
      <select
        aria-label={s.time.jumpTo}
        value=""
        disabled={!stories.length}
        onChange={(e) => {
          const story = stories.find((x) => x.id === e.target.value)
          if (!story) return
          onDate(story.date)
          onSlot(story.slot)
        }}
      >
        <option value="">{s.time.jumpTo}…</option>
        {stories.map((story) => (
          <option key={story.id} value={story.id}>
            {s.stories.name[story.id]} · {story.date} · {s.stories.note[story.id](story.value, story.other)}
          </option>
        ))}
      </select>
      <button aria-label={playing ? s.time.pause : s.time.play} disabled={!date} onClick={onPlay}>
        {playing ? '❚❚' : '▶'}
      </button>
      <input
        type="range"
        aria-label={s.time.halfHour}
        min={1}
        max={SLOTS}
        step={1}
        value={slot}
        onChange={(e) => onSlot(Number(e.target.value))}
      />
      <output>
        {stands && <span className={styles[stands.when]}>{dayWord}</span>} {slotRange(slot)} {s.time.jst}
        {stands?.offset === 0 && stands.when === 'now' && <span className={styles.now}> · {s.time.isNow}</span>}
        {stands?.offset === 0 && stands.when === 'ahead' && <span className="muted"> · {s.time.ahead}</span>}
      </output>
    </div>
  )
}
