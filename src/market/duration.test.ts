import spotCsv from '../test/fixtures/jepx-spot.csv?raw'
import { durationCurve } from './duration'
import { priceHistory } from './history'
import { parseSpot } from './jepx'

const spot = parseSpot(spotCsv)

test('every priced half hour from the dearest down, and the figures that read off the curve', () => {
  const days = priceHistory(spot, 'tokyo')
  const sorted = days.flatMap((d) => d.prices).sort((a, b) => b - a)
  const d = durationCurve(days, 5)!
  expect(d.halfHours).toBe(192)
  expect(d.curve).toEqual([sorted[0], sorted[48], sorted[96], sorted[143], sorted[191]])
  expect(d.curve[0]).toBe(50.01)
  expect(d.mean).toBeCloseTo(sorted.reduce((s, p) => s + p, 0) / 192)
  expect(d.median).toBe((sorted[95] + sorted[96]) / 2)
  expect(d.topTenth).toBe(sorted[19])
  expect(d.floorShare).toBe(sorted.filter((p) => p <= 0.01).length / 192)
  expect([d.from, d.to]).toEqual(['2026-09-22', '2026-09-26'])
  expect(d.ranked[0]).toEqual({ price: 50.01, date: '2026-09-22', slot: 34 })
  expect(d.ranked.map((r) => r.price)).toEqual(sorted)
})

test('a half hour without a price is left out, and nothing without any', () => {
  const days = priceHistory(spot)
  days[0].prices[0] = NaN
  expect(durationCurve(days)!.halfHours).toBe(191)
  expect(durationCurve([])).toBeNull()
})
