import { useState } from 'react'
import { SERIES, type Series } from '../market/stack'
import { DARK } from '../shared/palette'
import { cssRgb, PRICE_DOMAIN } from '../shared/scale'
import { useNarrow } from '../shared/useNarrow'
import styles from './Legend.module.css'

const gradient = `linear-gradient(to right, ${DARK.price.map(cssRgb).join(', ')})`

const FUEL: Record<Series, string> = {
  nuclear: 'Nuclear',
  coal: 'Coal',
  gas: 'Gas',
  otherThermal: 'Oil, other',
  hydro: 'Hydro',
  solar: 'Solar',
  wind: 'Wind',
  renewables: 'Geo, bio',
}

/** The key: the price ramp, the arrows and the fuels, behind a button on phones, where it would take the map. */
export default function Legend() {
  const narrow = useNarrow()
  const [open, setOpen] = useState(!narrow)
  const [lo, hi] = PRICE_DOMAIN
  return (
    <div className={styles.corner}>
      <button className={styles.toggle} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Key
      </button>
      {open && (
        <figure className={styles.legend} aria-label="Key">
          <div className={styles.ramp} style={{ background: gradient }} />
          <div className={styles.ticks}>
            <span>{lo}</span>
            <span>{(lo + hi) / 2}</span>
            <span>{hi}+ ¥/kWh</span>
          </div>
          <div className={styles.arrows}>
            <Arrow width={2} color={cssRgb(DARK.flow.idle)} /> flow
            <Arrow width={6} color={cssRgb(DARK.flow.full)} /> at the limit
            <Arrow width={6} color={cssRgb(DARK.flow.full)} rim /> split
          </div>
          <div className={styles.fuels}>
            {[...SERIES].reverse().map((s) => (
              <span key={s} className={styles.fuel}>
                <span className={styles.swatch} style={{ background: `var(--src-${s})` }} /> {FUEL[s]}
              </span>
            ))}
          </div>
        </figure>
      )}
    </div>
  )
}

/** A tapered arrow as the map draws them: a hair at the start, the width at the head, a rim where the market split. */
function Arrow({ width, color, rim = false }: { width: number; color: string; rim?: boolean }) {
  const shaft = (extra: number) =>
    `0,${12 - (1 + extra) / 2} 26,${12 - (width + extra) / 2} 26,${12 + (width + extra) / 2} 0,${12 + (1 + extra) / 2}`
  const size = 8 + width * 2
  return (
    <svg className={styles.arrowKey} width="40" height="24" viewBox="0 0 40 24" aria-hidden="true">
      {rim && <polygon points={shaft(4)} fill="var(--text)" />}
      <polygon points={shaft(0)} fill={color} />
      <polygon points={`26,${12 - size / 2} ${26 + size},12 26,${12 + size / 2}`} fill={color} />
    </svg>
  )
}
