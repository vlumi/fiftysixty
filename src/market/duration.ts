import { FLOOR_YEN } from './daily'
import type { HistoryDay } from './history'

/** The price duration curve over the days held, every priced half hour from the dearest down, and what reads off it. */
export interface Duration {
  /** The sorted prices read at evenly spaced ranks, the dearest first, as the curve draws them. */
  curve: number[]
  halfHours: number
  mean: number
  median: number
  /** The share of the half hours at the exchange's floor. */
  floorShare: number
  /** The price a tenth of the half hours stood at or above. */
  topTenth: number
  from: string
  to: string
}

export function durationCurve(days: readonly HistoryDay[], points = 200): Duration | null {
  const prices = days.flatMap((d) => d.prices.filter(Number.isFinite)).sort((a, b) => b - a)
  const n = prices.length
  if (!n) return null
  const at = (share: number) => prices[Math.min(n - 1, Math.floor(share * n))]
  return {
    curve: Array.from({ length: points }, (_, i) => prices[Math.round((i / (points - 1)) * (n - 1))]),
    halfHours: n,
    mean: prices.reduce((sum, p) => sum + p, 0) / n,
    median: (prices[Math.floor((n - 1) / 2)] + prices[Math.ceil((n - 1) / 2)]) / 2,
    floorShare: prices.filter((p) => p <= FLOOR_YEN).length / n,
    topTenth: at(0.1),
    from: days[0].date,
    to: days[days.length - 1].date,
  }
}
