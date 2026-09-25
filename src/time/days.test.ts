import csv from '../test/fixtures/jepx-spot.csv?raw'
import { parseSpot } from '../market/jepx'
import { formatDay, jstDate, openingDay, relation, shiftDay, slotNow } from './days'

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

test('a half hour stands past, now or ahead of the clock in Japan', () => {
  const now = new Date('2026-09-26T10:10:00+09:00')
  expect(relation('2026-09-25', 40, now)).toEqual({ offset: -1, when: 'past' })
  expect(relation('2026-09-27', 1, now)).toEqual({ offset: 1, when: 'ahead' })
  expect(relation('2026-09-22', 1, now)).toEqual({ offset: -4, when: 'past' })
  expect(relation('2026-09-29', 1, now)).toEqual({ offset: 3, when: 'ahead' })
  expect(relation('2026-09-26', 20, now)).toEqual({ offset: 0, when: 'past' })
  expect(relation('2026-09-26', 21, now)).toEqual({ offset: 0, when: 'now' })
  expect(relation('2026-09-26', 22, now)).toEqual({ offset: 0, when: 'ahead' })
})

test('the half hour under way in Japan', () => {
  expect(slotNow(new Date('2026-09-26T00:10:00+09:00'))).toBe(1)
  expect(slotNow(new Date('2026-09-26T10:10:00+09:00'))).toBe(21)
  expect(slotNow(new Date('2026-09-26T23:45:00+09:00'))).toBe(48)
})

test('the day in words carries its weekday in either language', () => {
  expect(formatDay('2026-09-24', 'en')).toBe('Thu, 24 Sept 2026')
  expect(formatDay('2026-09-24', 'ja')).toBe('2026年9月24日(木)')
})
