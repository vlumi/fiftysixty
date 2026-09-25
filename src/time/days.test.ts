import csv from '../test/fixtures/jepx-spot.csv?raw'
import { parseSpot } from '../market/jepx'
import { jstDate, openingDay, relation, shiftDay } from './days'

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
  expect(relation('2026-09-25', 40, now)).toEqual({ day: 'Yesterday', when: 'past' })
  expect(relation('2026-09-27', 1, now)).toEqual({ day: 'Tomorrow', when: 'ahead' })
  expect(relation('2026-09-22', 1, now)).toEqual({ day: '4 days ago', when: 'past' })
  expect(relation('2026-09-29', 1, now)).toEqual({ day: 'In 3 days', when: 'ahead' })
  expect(relation('2026-09-26', 20, now)).toEqual({ day: 'Today', when: 'past' })
  expect(relation('2026-09-26', 21, now)).toEqual({ day: 'Today', when: 'now' })
  expect(relation('2026-09-26', 22, now)).toEqual({ day: 'Today', when: 'ahead' })
})
