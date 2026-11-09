import csv from '../test/fixtures/jepx-spot.csv?raw'
import { priceHistory } from './history'
import { parseSpot, turnover } from './jepx'

const spot = parseSpot(csv)

test('the priced days in order, each its 48 prices by half hour, the system price or an area’s, and the day’s turnover whichever', () => {
  const system = priceHistory(spot)
  expect(system.map((d) => d.date)).toEqual(['2026-09-22', '2026-09-23', '2026-09-25', '2026-09-26'])
  expect(system[3].prices).toHaveLength(48)
  expect(system[3].prices[46]).toBe(14.12)
  expect(priceHistory(spot, 'tokyo')[0].prices[33]).toBe(50.01)
  expect(system[3].turnover).toBe(turnover(spot.get('2026-09-26')!))
  expect(priceHistory(spot, 'tokyo')[3].turnover).toBe(system[3].turnover)
})

test('a missing half hour is NaN, and no prices are no days', () => {
  const short = new Map([['2026-09-22', spot.get('2026-09-22')!.slice(0, 47)]])
  expect(priceHistory(short)[0].prices[47]).toBeNaN()
  expect(priceHistory(null)).toEqual([])
})
