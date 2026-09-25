import { SERIES, SERIES_SHORT, type Series } from '../market/stack'
import type { Plants } from '../regions/plants'
import styles from './Plants.module.css'

interface Props {
  plants: Plants | null
  hiddenFuels: readonly Series[]
  onToggle: (fuel: Series) => void
  onHide: (fuels: Series[]) => void
  /** Whether the map is close enough for the plants to show at all. */
  shown: boolean
}

/** The plants' filter, a row a fuel with its count, the pressed ones on the map; and the fuels' key by the same token. */
export default function PlantsPanel({ plants, hiddenFuels, onToggle, onHide, shown }: Props) {
  const counts = new Map<Series, number>()
  for (const f of plants?.features ?? []) counts.set(f.properties.fuel, (counts.get(f.properties.fuel) ?? 0) + 1)
  return (
    <section className={styles.panel} aria-label="Plants">
      <div className={styles.all}>
        <button onClick={() => onHide([])} disabled={hiddenFuels.length === 0}>
          All
        </button>
        <button onClick={() => onHide([...SERIES])} disabled={hiddenFuels.length === SERIES.length}>
          None
        </button>
        {!shown && <span className={styles.hint}>zoom in to see them</span>}
      </div>
      {[...SERIES].reverse().map((s) => {
        const count = counts.get(s) ?? 0
        return (
          <button
            key={s}
            className={styles.fuel}
            aria-label={`${SERIES_SHORT[s]}, ${count} ${count === 1 ? 'plant' : 'plants'}`}
            aria-pressed={!hiddenFuels.includes(s)}
            onClick={() => onToggle(s)}
          >
            <span className={styles.swatch} style={{ background: `var(--src-${s})` }} />
            <span className={styles.name}>{SERIES_SHORT[s]}</span>
            <span className={styles.count}>{count}</span>
          </button>
        )
      })}
    </section>
  )
}
