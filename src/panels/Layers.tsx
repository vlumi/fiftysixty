import { useStrings } from '../i18n/useStrings'
import type { LayerChoice, MapLayer } from '../map/layerChoice'
import { MAP_LAYERS } from '../map/layerChoice'
import { SERIES, type Series } from '../market/stack'
import type { Plants } from '../regions/plants'
import styles from './Layers.module.css'

interface Props {
  layers: LayerChoice
  onToggleLayer: (layer: MapLayer) => void
  plants: Plants | null
  hiddenFuels: readonly Series[]
  onToggle: (fuel: Series) => void
  onHide: (fuels: Series[]) => void
}

/**
 * What the map draws: a switch each for the arrows, the columns and the plants, and under the plants their filter, a
 * row a fuel with its count, the pressed ones on the map, which is the fuels' key by the same token.
 */
export default function LayersPanel({ layers, onToggleLayer, plants, hiddenFuels, onToggle, onHide }: Props) {
  const s = useStrings()
  const counts = new Map<Series, number>()
  for (const f of plants?.features ?? []) counts.set(f.properties.fuel, (counts.get(f.properties.fuel) ?? 0) + 1)
  return (
    <section className={styles.panel} aria-label={s.key.layers}>
      {MAP_LAYERS.map((layer) => (
        <button
          key={layer}
          className={styles.layer}
          role="switch"
          aria-checked={layers[layer]}
          onClick={() => onToggleLayer(layer)}
        >
          <span className={styles.check} aria-hidden="true">
            {layers[layer] ? '✓' : ''}
          </span>
          <span className={styles.name}>{s.key[layer]}</span>
        </button>
      ))}
      {layers.plants && (
        <PlantsFilter plants={plants} counts={counts} hiddenFuels={hiddenFuels} onToggle={onToggle} onHide={onHide} />
      )}
    </section>
  )
}

interface FilterProps {
  plants: Plants | null
  counts: ReadonlyMap<Series, number>
  hiddenFuels: readonly Series[]
  onToggle: (fuel: Series) => void
  onHide: (fuels: Series[]) => void
}

function PlantsFilter({ counts, hiddenFuels, onToggle, onHide }: FilterProps) {
  const s = useStrings()
  return (
    <div className={styles.filter}>
      <div className={styles.all}>
        <button onClick={() => onHide([])} disabled={hiddenFuels.length === 0}>
          {s.key.all}
        </button>
        <button onClick={() => onHide([...SERIES])} disabled={hiddenFuels.length === SERIES.length}>
          {s.key.none}
        </button>
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
    </div>
  )
}
