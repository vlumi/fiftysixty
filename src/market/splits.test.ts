import spotCsv from '../test/fixtures/jepx-spot.csv?raw'
import { parseSpot } from './jepx'
import { scopeLines, splitHistory } from './splits'

const spot = parseSpot(spotCsv)

test("the lines a scope's splits concern: the area's own, the converters for a half, all ten for the system, none for Okinawa", () => {
  expect(scopeLines('kansai', null).map((l) => l.id)).toEqual([
    'chubu-kansai',
    'hokuriku-kansai',
    'kansai-chugoku',
    'kansai-shikoku',
  ])
  expect(scopeLines(null, 50).map((l) => l.id)).toEqual(['fc'])
  expect(scopeLines(null, null)).toHaveLength(10)
  expect(scopeLines('okinawa', 60)).toEqual([])
})

test('a day a column, a line a row: the share of its half hours the ends priced apart', () => {
  const { lines, days } = splitHistory(spot, scopeLines(null, null))
  expect(days.map((d) => d.date)).toEqual(['2026-09-22', '2026-09-23', '2026-09-25', '2026-09-26'])
  const share = (date: string, id: string) =>
    days.find((d) => d.date === date)!.shares[lines.findIndex((l) => l.id === id)] * 48
  // The holiday: the converters split two half hours, Kansai–Chugoku thirteen, Chubu–Kansai every one.
  expect(share('2026-09-23', 'fc')).toBe(2)
  expect(share('2026-09-23', 'kansai-chugoku')).toBe(13)
  expect(share('2026-09-23', 'chubu-kansai')).toBe(48)
  expect(share('2026-09-26', 'hokuriku-kansai')).toBe(0)
  expect(splitHistory(null, lines)).toEqual({ lines, days: [] })
})
