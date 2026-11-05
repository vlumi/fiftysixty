import { useStrings } from '../../i18n/useStrings'
import { useApp } from '../../store'
import styles from './Readout.module.css'

/**
 * The scope, all Japan or a half, and the view, the half hour, the day or the history, as button groups over the
 * readout's body; the scope is left out for a picked area, which is in one half already.
 */
export default function Switches({ halves }: { halves: boolean }) {
  const s = useStrings()
  const view = useApp((x) => x.view)
  const setView = useApp((x) => x.setView)
  const half = useApp((x) => x.half)
  const setHalf = useApp((x) => x.setHalf)
  return (
    <div className={styles.switches}>
      {halves && (
        <div className={`${styles.views} ${styles.scope}`} role="group" aria-label={s.readout.half}>
          <button aria-pressed={half === null} onClick={() => setHalf(null)}>
            {s.day.japan}
          </button>
          {([50, 60] as const).map((hz) => (
            <button key={hz} className={styles[`hz${hz}`]} aria-pressed={half === hz} onClick={() => setHalf(hz)}>
              {s.readout.hz(hz)}
            </button>
          ))}
        </div>
      )}
      <div className={styles.views} role="group" aria-label={s.day.view}>
        {(['slot', 'day', 'history'] as const).map((v) => (
          <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
            {v === 'slot' ? s.day.halfHour : v === 'day' ? s.day.day : s.day.history}
          </button>
        ))}
      </div>
    </div>
  )
}
