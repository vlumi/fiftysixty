import { useState } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { Series } from '../market/stack'
import type { Plants } from '../regions/plants'
import type { Palette } from '../shared/palette'
import { useNarrow } from '../shared/useNarrow'
import CloseButton from './CloseButton'
import styles from './Corner.module.css'
import Legend from './Legend'
import type { LayerChoice, MapLayer } from '../map/layerChoice'
import LayersPanel from './Layers'

type Open = 'key' | 'layers' | null

interface Props {
  palette: Palette
  layers: LayerChoice
  onToggleLayer: (layer: MapLayer) => void
  plants: Plants | null
  hiddenFuels: readonly Series[]
  onToggleFuel: (fuel: Series) => void
  onHideFuels: (fuels: Series[]) => void
}

/** The bottom corner: a Layers and a Key button, one panel open above them at a time, the key open by default on a wide screen. */
export default function Corner({
  palette,
  layers,
  onToggleLayer,
  plants,
  hiddenFuels,
  onToggleFuel,
  onHideFuels,
}: Props) {
  const s = useStrings()
  const narrow = useNarrow()
  const [open, setOpen] = useState<Open>(narrow ? null : 'key')
  const toggle = (which: Exclude<Open, null>) => setOpen((o) => (o === which ? null : which))
  return (
    <div className={styles.corner}>
      {open && (
        <div className={styles.sheet}>
          <CloseButton onClick={() => setOpen(null)} />
          {open === 'key' ? (
            <Legend palette={palette} />
          ) : (
            <LayersPanel
              layers={layers}
              onToggleLayer={onToggleLayer}
              plants={plants}
              hiddenFuels={hiddenFuels}
              onToggle={onToggleFuel}
              onHide={onHideFuels}
            />
          )}
        </div>
      )}
      <div className={styles.buttons}>
        <button
          className={styles.toggle}
          aria-label={s.key.layers}
          title={s.key.layers}
          aria-expanded={open === 'layers'}
          onClick={() => toggle('layers')}
        >
          <LayersIcon />
        </button>
        <button
          className={styles.toggle}
          aria-label={s.key.key}
          title={s.key.key}
          aria-expanded={open === 'key'}
          onClick={() => toggle('key')}
        >
          <KeyIcon />
        </button>
      </div>
    </div>
  )
}

/** Three sheets stacked, for the layers. */
function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M9 2 16 6 9 10 2 6Z" fill="currentColor" />
      <path d="M2 9.5 9 13.5 16 9.5M2 12.5 9 16.5 16 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

/** Three swatches with their lines, for the key. */
function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="2" y="2.5" width="4" height="4" rx="1" fill="currentColor" />
      <rect x="2" y="7.5" width="4" height="4" rx="1" fill="currentColor" />
      <rect x="2" y="12.5" width="4" height="4" rx="1" fill="currentColor" />
      <path d="M8 4.5h8M8 9.5h8M8 14.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
