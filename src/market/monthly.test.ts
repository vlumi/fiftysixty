import tepcoCsv from '../test/fixtures/tepco-jukyu.csv?raw'
import kyushuCsv from '../test/fixtures/kyushu-jukyu.csv?raw'
import spotCsv from '../test/fixtures/jepx-spot.csv?raw'
import type { Area } from '../regions/areas'
import { dayTotals, priceStats, weightedPrice } from './daily'
import { parseSpot } from './jepx'
import { KYUSHU } from './kyushu'
import { pricedMonth, recordedMonth, spreadMonth, summedMonth, type MonthRecords } from './monthly'
import type { RecordDays } from './record'
import { TEPCO } from './tepco'

/** Tokyo has the 24th whole and three half hours of the 25th; Kyushu the 22nd whole; Hokkaido's file is missing. */
const tokyo = TEPCO.parse(tepcoCsv)
const kyushu = KYUSHU.parse(kyushuCsv)
const spot = parseSpot(spotCsv)
const records: MonthRecords = new Map<Area, RecordDays | null>([
  ['tokyo', tokyo],
  ['kyushu', kyushu],
  ['hokkaido', null],
])

test("an area's month is its whole days, the day still running left out", () => {
  const days = recordedMonth(tokyo)
  expect(days.map((d) => d.date)).toEqual(['2026-09-24'])
  expect(days[0].totals).toEqual(dayTotals(tokyo.get('2026-09-24')!))
  expect(days[0].missing).toEqual([])
  expect(recordedMonth(null)).toEqual([])
})

test("a scope's month takes its days from every area's records, a day with an area missing marked as such", () => {
  const days = summedMonth(records, ['hokkaido', 'tokyo', 'kyushu'])
  expect(days.map((d) => `${d.date} without ${d.missing.join(', ')}`)).toEqual([
    '2026-09-22 without hokkaido, tokyo',
    '2026-09-24 without hokkaido, kyushu',
  ])
  expect(days[0].totals.demandMWh).toBeCloseTo(dayTotals(kyushu.get('2026-09-22')!).demandMWh)
  expect(summedMonth(new Map([['hokkaido', null]]), ['hokkaido'])).toEqual([])
})

test("the month's priced days carry each day's low, high and mean, the area's or the system's", () => {
  const days = pricedMonth(spot, '202609')
  expect(days.map((d) => d.date)).toEqual(['2026-09-22', '2026-09-23', '2026-09-25', '2026-09-26'])
  const stats = priceStats(spot.get('2026-09-22'))!
  expect(days[0]).toEqual({ date: '2026-09-22', low: stats.low.price, high: stats.high.price, mean: stats.mean })
  expect(pricedMonth(spot, '202609', 'tokyo')[0].high).toBe(50.01)
  expect(pricedMonth(spot, '202610')).toEqual([])
})

test("a half's month is each day's spread across its areas, the tick its weighted price only where the records are whole", () => {
  const days = spreadMonth(spot, '202609', ['tokyo', 'kyushu'], records)
  expect(days.map((d) => d.date)).toEqual(['2026-09-22', '2026-09-23', '2026-09-25', '2026-09-26'])
  expect(days[0]).toEqual({ date: '2026-09-22', low: 0.01, high: 50.01, mean: expect.any(Number) })
  // The 22nd is Kyushu's alone, so its tick weighs Kyushu's demand; the 25th runs three half hours, so it has none.
  expect(days[0].mean).toBeCloseTo(
    weightedPrice(spot.get('2026-09-22'), new Map([['kyushu', kyushu.get('2026-09-22')!]]))!,
  )
  expect(days.slice(1).map((d) => d.mean)).toEqual([null, null, null])
})
