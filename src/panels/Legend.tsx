import { DARK } from '../shared/palette'
import { cssRgb, PRICE_DOMAIN } from '../shared/scale'
import styles from './Legend.module.css'

const gradient = `linear-gradient(to right, ${DARK.price.map(cssRgb).join(', ')})`

/** The key: the price ramp with its ends, and the arrows as the map draws them. */
export default function Legend() {
  const [lo, hi] = PRICE_DOMAIN
  return (
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
    </figure>
  )
}

/** A tapered arrow as the map draws them: a hair at the start, the width at the head, a rim where the market split. */
function Arrow({ width, color, rim = false }: { width: number; color: string; rim?: boolean }) {
  const shaft = (extra: number) =>
    `0,${12 - (1 + extra) / 2} 26,${12 - (width + extra) / 2} 26,${12 + (width + extra) / 2} 0,${12 + (1 + extra) / 2}`
  const size = 8 + width * 2
  return (
    <svg className={styles.arrowKey} width="52" height="24" viewBox="0 0 52 24" aria-hidden="true">
      {rim && <polygon points={shaft(4)} fill="var(--text)" />}
      <polygon points={shaft(0)} fill={color} />
      <polygon points={`26,${12 - size / 2} ${26 + size},12 26,${12 + size / 2}`} fill={color} />
    </svg>
  )
}
