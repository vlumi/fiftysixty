import { useState } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { Series } from '../market/stack'
import type { Plants } from '../regions/plants'
import type { Palette } from '../shared/palette'
import { useNarrow } from '../shared/useNarrow'
import CloseButton from './CloseButton'
import styles from './Corner.module.css'
import Legend from './Legend'
import PlantsPanel from './Plants'

type Open = 'key' | 'plants' | null

interface Props {
  palette: Palette
  plants: Plants | null
  hiddenFuels: readonly Series[]
  onToggleFuel: (fuel: Series) => void
  onHideFuels: (fuels: Series[]) => void
}

/** The bottom corner: a Key and a Plants button, one panel open above them at a time, the key open by default on a wide screen. */
export default function Corner({ palette, plants, hiddenFuels, onToggleFuel, onHideFuels }: Props) {
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
            <PlantsPanel plants={plants} hiddenFuels={hiddenFuels} onToggle={onToggleFuel} onHide={onHideFuels} />
          )}
        </div>
      )}
      <div className={styles.buttons}>
        <button className={styles.toggle} aria-expanded={open === 'plants'} onClick={() => toggle('plants')}>
          {s.key.plants}
        </button>
        <button className={styles.toggle} aria-expanded={open === 'key'} onClick={() => toggle('key')}>
          {s.key.key}
        </button>
      </div>
    </div>
  )
}
