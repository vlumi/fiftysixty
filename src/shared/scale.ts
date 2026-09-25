import type { Rgb } from './palette'

/** The fixed price domain in yen per kWh, so one day's colors mean the same as another's. */
export const PRICE_DOMAIN: readonly [number, number] = [0, 50]

/** The color `t` of the way from `a` to `b`, channel by channel. */
export const lerpRgb = (a: Rgb, b: Rgb, t: number): Rgb =>
  [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)) as Rgb

/** A sequential scale over the ramp: the domain's low end is the first stop, the high end the last, clamped beyond. */
export function priceColor(price: number, ramp: readonly Rgb[]): Rgb {
  const [lo, hi] = PRICE_DOMAIN
  const t = (Number.isFinite(price) ? Math.min(1, Math.max(0, (price - lo) / (hi - lo))) : 0) * (ramp.length - 1)
  const i = Math.min(ramp.length - 2, Math.floor(t))
  return lerpRgb(ramp[i], ramp[i + 1], t - i)
}

export const cssRgb = (c: Rgb) => `rgb(${c[0]} ${c[1]} ${c[2]})`
