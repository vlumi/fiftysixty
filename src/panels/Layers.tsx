import { useState } from 'react'
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
 * What the map draws: a box each for the arrows, the columns and the plants. The plants' box shows or hides them all,
 * half-checked while some fuels are hidden, and a chevron beside it opens their filter: a row a fuel with its count,
 * the pressed ones on the map, which is the fuels' key by the same token.
 */
export default function LayersPanel({ layers, onToggleLayer, plants, hiddenFuels, onToggle, onHide }: Props) {
  const s = useStrings()
  const [byFuel, setByFuel] = useState(false)
  const shown = SERIES.length - hiddenFuels.length
  const plantsChecked = shown === SERIES.length ? true : shown === 0 ? false : 'mixed'
  const counts = new Map<Series, number>()
  for (const f of plants?.features ?? []) counts.set(f.properties.fuel, (counts.get(f.properties.fuel) ?? 0) + 1)
  return (
    <section className={styles.panel} aria-label={s.key.layers}>
      {MAP_LAYERS.map((layer) => (
        <Box key={layer} checked={layers[layer]} name={s.key[layer]} onClick={() => onToggleLayer(layer)} />
      ))}
      <div className={styles.row}>
        <Box
          checked={plantsChecked}
          name={s.key.plants}
          onClick={() => onHide(plantsChecked === true ? [...SERIES] : [])}
        />
        <button
          className={styles.expand}
          aria-label={s.key.byFuel}
          title={s.key.byFuel}
          aria-expanded={byFuel}
          onClick={() => setByFuel((open) => !open)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 6 8 10 12 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {byFuel && (
        <div className={styles.filter}>
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
      )}
    </section>
  )
}

/** A layer's row: a box and its name, the whole row the click. */
function Box({ checked, name, onClick }: { checked: boolean | 'mixed'; name: string; onClick: () => void }) {
  return (
    <button className={styles.layer} role="checkbox" aria-checked={checked} onClick={onClick}>
      <span className={styles.check} aria-hidden="true">
        {checked === true ? '✓' : checked === 'mixed' ? '–' : ''}
      </span>
      <span className={styles.name}>{name}</span>
    </button>
  )
}
