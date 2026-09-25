import csv from '../test/fixtures/jepx-spot.csv?raw'
import { parseSpot } from '../market/jepx'
import { jstDate, openingDay, shiftDay } from './days'

test('the day in Japan turns at 15:00 UTC', () => {
  expect(jstDate(new Date('2026-09-25T14:59:00Z'))).toBe('2026-09-25')
  expect(jstDate(new Date('2026-09-25T15:00:00Z'))).toBe('2026-09-26')
})

test('days shift across month and year ends', () => {
  expect(shiftDay('2026-09-30', 1)).toBe('2026-10-01')
  expect(shiftDay('2027-01-01', -1)).toBe('2026-12-31')
})

test('the site opens on yesterday in Japan when priced, else on the newest priced day', () => {
  const days = parseSpot(csv)
  expect(openingDay(days, new Date('2026-09-26T03:00:00+09:00'))).toBe('2026-09-25')
  expect(openingDay(days, new Date('2026-09-25T03:00:00+09:00'))).toBe('2026-09-26')
  expect(openingDay(null, new Date())).toBeNull()
})
