import { Fragment } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { Palette, Rgb } from '../shared/palette'
import { cssRgb, PRICE_DOMAIN } from '../shared/scale'
import styles from './Legend.module.css'

/**
 * The key: the price ramp of each half of the grid with the ends they share; the arrows as the map draws them, a
 * planned and a recorded flow each running from its idle gray to its full color, since the width is the megawatts and
 * the color how near the line is to its limit, which a line says under them; a fork; and the market's wall.
 */
export default function Legend({ palette }: { palette: Palette }) {
  const s = useStrings()
  const [lo, hi] = PRICE_DOMAIN
  return (
    <figure className={styles.legend} aria-label={s.key.key}>
      <div className={styles.ramps}>
        {([50, 60] as const).map((hz) => (
          <Fragment key={hz}>
            <span className={styles.hz} style={{ color: `var(--hz${hz})` }}>
              {hz} Hz
            </span>
            <div
              className={styles.ramp}
              style={{ background: `linear-gradient(to right, ${palette.price[hz].map(cssRgb).join(', ')})` }}
            />
          </Fragment>
        ))}
        <span />
        <div className={styles.ticks}>
          <span>{lo}</span>
          <span>{(lo + hi) / 2}</span>
          <span>{hi}+ ¥/kWh</span>
        </div>
      </div>
      <div className={styles.arrows}>
        <Arrow id="planned" ramp={palette.flow.planned} /> {s.key.planned}
        <Arrow id="recorded" ramp={palette.flow.recorded} /> {s.key.recorded}
        <ForkKey color={cssRgb(palette.flow.planned.idle)} /> {s.key.fork}
        <Wall /> {s.key.split}
      </div>
      <p className={styles.howArrows}>{s.key.howArrows}</p>
    </figure>
  )
}

/** A tapered arrow as the map draws them, a hair at the start and the width at the head, in its kind's ramp from idle to full. */
function Arrow({ id, ramp }: { id: string; ramp: { idle: Rgb; full: Rgb } }) {
  const width = 3
  const shaft = `0,${12 - 1 / 2} 26,${12 - width / 2} 26,${12 + width / 2} 0,${12 + 1 / 2}`
  const size = 8 + width * 2
  const gradient = `key-${id}`
  return (
    <svg className={styles.arrowKey} width="52" height="24" viewBox="0 0 52 24" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={cssRgb(ramp.idle)} />
          <stop offset="1" stopColor={cssRgb(ramp.full)} />
        </linearGradient>
      </defs>
      <polygon points={shaft} fill={`url(#${gradient})`} />
      <polygon points={`26,${12 - size / 2} ${26 + size},12 26,${12 + size / 2}`} fill={cssRgb(ramp.full)} />
    </svg>
  )
}

/** The wall between two areas the auction priced apart, as the map draws it on their border. */
function Wall() {
  return (
    <svg className={styles.arrowKey} width="52" height="24" viewBox="0 0 52 24" aria-hidden="true">
      <path
        d="M8 21 L20 8 L32 15 L44 3"
        fill="none"
        stroke="var(--text)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A fork as the map draws one: two thin tails meeting, then one arrow carrying the total. */
function ForkKey({ color }: { color: string }) {
  return (
    <svg className={styles.arrowKey} width="52" height="24" viewBox="0 0 52 24" aria-hidden="true">
      <path d="M2 4 L20 12 M2 20 L20 12" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="20,11.5 32,10 32,14 20,12.5" fill={color} />
      <polygon points="32,6 44,12 32,18" fill={color} />
    </svg>
  )
}
