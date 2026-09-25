import { fiscalYear, latestDay, loadSpotYears, parseSpot, slotOf } from './jepx'
import csv from '../test/fixtures/jepx-spot.csv?raw'

test('four real days parse into 48 slots each, found by column name', () => {
  const days = parseSpot(csv)
  expect([...days.keys()]).toEqual(['2026-09-22', '2026-09-23', '2026-09-25', '2026-09-26'])
  expect(days.get('2026-09-26')).toHaveLength(48)
  expect(days.get('2026-09-26')![46]).toEqual({
    slot: 47,
    systemPrice: 14.12,
    volumeKWh: 18827400,
    areaPrice: {
      hokkaido: 10.45,
      tohoku: 10.45,
      tokyo: 22.02,
      chubu: 22.02,
      hokuriku: 10.04,
      kansai: 10.04,
      chugoku: 10.04,
      shikoku: 10.04,
      kyushu: 10.04,
    },
  })
})

test('a header without the area columns is refused', () => {
  expect(() => parseSpot('受渡日,時刻コード\n2026/04/01,1')).toThrow('約定総量')
})

test('the latest day and a slot in it', () => {
  const days = parseSpot(csv)
  expect(latestDay(days)).toBe('2026-09-26')
  expect(latestDay(null)).toBeNull()
  expect(slotOf(days, '2026-09-26', 48)?.areaPrice.tokyo).toBe(15.98)
  expect(slotOf(days, '2026-09-27', 1)).toBeUndefined()
})

test('the fiscal year turns in April', () => {
  expect(fiscalYear(new Date(2026, 8, 25))).toBe(2026)
  expect(fiscalYear(new Date(2027, 2, 31))).toBe(2026)
  expect(fiscalYear(new Date(2027, 3, 1))).toBe(2027)
})

test('the years are loaded together, a year the host lacks contributing nothing', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(url.endsWith('2026.csv') ? new Response(csv) : new Response('', { status: 404 })),
    ),
  )
  const days = await loadSpotYears(2026)
  expect([...days.keys()]).toEqual(['2026-09-22', '2026-09-23', '2026-09-25', '2026-09-26'])
  vi.unstubAllGlobals()
})
