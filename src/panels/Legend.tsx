import { DARK } from '../shared/palette'
import { cssRgb, PRICE_DOMAIN } from '../shared/scale'
import styles from './Legend.module.css'

const gradient = `linear-gradient(to right, ${DARK.price.map(cssRgb).join(', ')})`

/** The price scale: the ramp from the low end of the domain to the high, in yen per kWh; the arrows; the plants when shown. */
export default function Legend({ plants = false }: { plants?: boolean }) {
  const [lo, hi] = PRICE_DOMAIN
  return (
    <figure className={styles.legend} aria-label="Price scale">
      <div className={styles.ramp} style={{ background: gradient }} />
      <div className={styles.ticks}>
        <span>{lo}</span>
        <span>{(lo + hi) / 2}</span>
        <span>{hi}+ ¥/kWh</span>
      </div>
      <div className={styles.lines}>
        <span className={styles.arrow} /> flow, wider for more, brighter nearer the limit
        <br />
        <span className={`${styles.arrow} ${styles.rimmed}`} /> the market split there
        {plants && (
          <>
            <br />
            <span className={styles.dot} /> plants by fuel in the chart's colors, area by capacity
          </>
        )}
      </div>
    </figure>
  )
}
