import csv from '../test/fixtures/jepx-spot.csv?raw'
import { parseSpot } from './jepx'
import { stories } from './stories'

test('the story days are found in the prices: peaks by season, the widest split, the floor, the cheapest day', () => {
  const days = parseSpot(csv)
  const found = stories(days)
  expect(found.map((s) => s.id)).toEqual(['summer', 'split', 'floor', 'cheapest'])
  const rows = [...days].flatMap(([date, slots]) => slots.map((slot) => ({ date, ...slot })))
  const peak = rows.reduce((a, b) => (b.systemPrice > a.systemPrice ? b : a))
  expect(found.find((s) => s.id === 'summer')).toEqual({
    id: 'summer',
    name: 'Summer peak',
    date: peak.date,
    slot: peak.slot,
    note: `system price ${peak.systemPrice.toFixed(2)} ¥/kWh`,
  })
  const floor = found.find((s) => s.id === 'floor')!
  const atFloor = (date: string) =>
    days.get(date)!.reduce((n, s) => n + Object.values(s.areaPrice).filter((p) => p <= 0.01).length, 0)
  expect(floor.date).toBe([...days.keys()].reduce((a, b) => (atFloor(b) > atFloor(a) ? b : a)))
  expect(atFloor(floor.date)).toBeGreaterThan(0)
  expect(floor.note).toMatch(/^\d+ area half hours at 0.01 ¥\/kWh$/)
  const cheapest = found.find((s) => s.id === 'cheapest')!
  const means = [...days].map(
    ([date, slots]) => [date, slots.reduce((sum, s) => sum + s.systemPrice, 0) / slots.length] as const,
  )
  expect(cheapest.date).toBe(means.reduce((a, b) => (b[1] < a[1] ? b : a))[0])
  expect(cheapest.slot).toBe(25)
})

test('no prices, no stories; no winter day held, no winter peak', () => {
  expect(stories(null)).toEqual([])
  expect(stories(new Map())).toEqual([])
  expect(stories(parseSpot(csv)).some((s) => s.id === 'winter')).toBe(false)
})
