import { useState } from 'react'
import type { Series } from '../market/stack'
import type { Plants } from '../regions/plants'
import { useNarrow } from '../shared/useNarrow'
import styles from './Corner.module.css'
import Legend from './Legend'
import PlantsPanel from './Plants'

type Open = 'key' | 'plants' | null

interface Props {
  plants: Plants | null
  hiddenFuels: readonly Series[]
  onToggleFuel: (fuel: Series) => void
  onHideFuels: (fuels: Series[]) => void
  plantsShown: boolean
}

/** The bottom corner: a Key and a Plants button, one panel open above them at a time, the key open by default on a wide screen. */
export default function Corner({ plants, hiddenFuels, onToggleFuel, onHideFuels, plantsShown }: Props) {
  const narrow = useNarrow()
  const [open, setOpen] = useState<Open>(narrow ? null : 'key')
  const toggle = (which: Exclude<Open, null>) => setOpen((o) => (o === which ? null : which))
  return (
    <div className={styles.corner}>
      {open === 'key' && <Legend />}
      {open === 'plants' && (
        <PlantsPanel
          plants={plants}
          hiddenFuels={hiddenFuels}
          onToggle={onToggleFuel}
          onHide={onHideFuels}
          shown={plantsShown}
        />
      )}
      <div className={styles.buttons}>
        <button className={styles.toggle} aria-expanded={open === 'plants'} onClick={() => toggle('plants')}>
          Plants
        </button>
        <button className={styles.toggle} aria-expanded={open === 'key'} onClick={() => toggle('key')}>
          Key
        </button>
      </div>
    </div>
  )
}
