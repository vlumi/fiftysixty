import type { HistoryDay } from '../market/history'
import { SLOTS } from '../market/jepx'
import type { Rgb } from '../shared/palette'
import { priceColor } from '../shared/scale'

/**
 * The heatmap's pixels, RGBA by row then column: `width` columns across the days and a row a half hour, 00:00 at
 * the top. A column averages the days that fall in it, one or two at a year across a panel, so no day is skipped;
 * with fewer days than columns a day spans several. A cell without a price is left clear.
 */
export function heatmapPixels(days: readonly HistoryDay[], ramp: readonly Rgb[], width: number): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * SLOTS * 4)
  const n = days.length
  for (let x = 0; x < width; x++) {
    const from = Math.floor((x * n) / width)
    const to = Math.max(from + 1, Math.floor(((x + 1) * n) / width))
    for (let row = 0; row < SLOTS; row++) {
      let sum = 0
      let count = 0
      for (let i = from; i < to; i++) {
        const price = days[i].prices[row]
        if (Number.isFinite(price)) {
          sum += price
          count++
        }
      }
      if (!count) continue
      const [r, g, b] = priceColor(sum / count, ramp)
      pixels.set([r, g, b, 255], (row * width + x) * 4)
    }
  }
  return pixels
}

/** The day's index and the half hour under a point given as fractions of the plot, left to right and top down. */
export function cellAt(fx: number, fy: number, days: number): { index: number; slot: number } {
  const clamp = (v: number, max: number) => Math.min(max, Math.max(0, Math.floor(v)))
  return { index: clamp(fx * days, days - 1), slot: clamp(fy * SLOTS, SLOTS - 1) + 1 }
}

/** The indices where a month begins, the first day counted, for the ticks along the foot. */
export function monthStarts(dates: readonly string[]): number[] {
  return dates.flatMap((d, i) => (i === 0 || d.slice(0, 7) !== dates[i - 1].slice(0, 7) ? [i] : []))
}

/**
 * Of the ticks, those to label so the labels never collide: the `first` ones always, the years, and of the rest each
 * at least `gap` days from every one kept.
 */
export function labeled(starts: readonly number[], gap: number, first: readonly number[] = []): number[] {
  const kept = [...first]
  for (const i of starts) if (kept.every((k) => Math.abs(i - k) >= gap)) kept.push(i)
  return kept.sort((a, b) => a - b)
}
