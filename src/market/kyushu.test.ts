import csv from '../test/fixtures/kyushu-jukyu.csv?raw'
import { KYUSHU } from './kyushu'
import { recordSlot } from './record'

const days = KYUSHU.parse(csv)

test('a real day parses into 48 slots from the end-marked times, 0:30 first and 24:00 last', () => {
  expect([...days.keys()]).toEqual(['2026-09-22'])
  expect(days.get('2026-09-22')!.map((s) => s.slot)).toEqual(Array.from({ length: 48 }, (_, i) => i + 1))
})

test('a curtailed noon, with the export made negative so the balance closes', () => {
  const at = recordSlot(days, '2026-09-22', 23)!
  expect(at.demandMW).toBe(9786)
  expect(at.bySource.solar).toBe(6562)
  expect(at.curtailedMW).toEqual({ solar: 1877, wind: 218 })
  expect(at.bySource.interconnector).toBe(-1944)
  const generated = Object.values(at.bySource).reduce((a, b) => a + b, 0)
  expect(Math.abs(generated - at.demandMW)).toBeLessThan(20)
})

test('the file for a month', () => {
  expect(KYUSHU.file('202609')).toBe('kyushu-jukyu-202609.csv')
})
