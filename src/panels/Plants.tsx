import { useStrings } from '../i18n/useStrings'
import { SERIES, type Series } from '../market/stack'
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
  const s = useStrings()
  const counts = new Map<Series, number>()
  for (const f of plants?.features ?? []) counts.set(f.properties.fuel, (counts.get(f.properties.fuel) ?? 0) + 1)
  return (
    <section className={styles.panel} aria-label={s.key.plants}>
      <div className={styles.all}>
        <button onClick={() => onHide([])} disabled={hiddenFuels.length === 0}>
          {s.key.all}
        </button>
        <button onClick={() => onHide([...SERIES])} disabled={hiddenFuels.length === SERIES.length}>
          {s.key.none}
        </button>
        {!shown && <span className={styles.hint}>{s.key.zoomIn}</span>}
      </div>
      {[...SERIES].reverse().map((x) => {
        const count = counts.get(x) ?? 0
        return (
          <button
            key={x}
            className={styles.fuel}
            aria-label={`${s.key.fuel[x]}, ${s.key.count(count)}`}
            aria-pressed={!hiddenFuels.includes(x)}
            onClick={() => onToggle(x)}
          >
            <span className={styles.swatch} style={{ background: `var(--src-${x})` }} />
            <span className={styles.name}>{s.key.fuel[x]}</span>
            <span className={styles.count}>{count}</span>
          </button>
        )
      })}
    </section>
  )
}
