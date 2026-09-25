import { useStrings } from '../i18n/useStrings'
import type { Palette } from '../shared/palette'
import { cssRgb, PRICE_DOMAIN } from '../shared/scale'
import styles from './Legend.module.css'

/** The key: the price ramp with its ends, and the arrows as the map draws them, in the theme's palette. */
export default function Legend({ palette }: { palette: Palette }) {
  const s = useStrings()
  const [lo, hi] = PRICE_DOMAIN
  const gradient = `linear-gradient(to right, ${palette.price.map(cssRgb).join(', ')})`
  return (
    <figure className={styles.legend} aria-label={s.key.key}>
      <div className={styles.ramp} style={{ background: gradient }} />
      <div className={styles.ticks}>
        <span>{lo}</span>
        <span>{(lo + hi) / 2}</span>
        <span>{hi}+ ¥/kWh</span>
      </div>
      <div className={styles.arrows}>
        <Arrow width={2} color={cssRgb(palette.flow.idle)} /> {s.key.flow}
        <Arrow width={6} color={cssRgb(palette.flow.full)} /> {s.key.atLimit}
        <Arrow width={6} color={cssRgb(palette.flow.full)} rim /> {s.key.split}
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
