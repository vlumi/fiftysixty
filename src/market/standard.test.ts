import chubu from '../test/fixtures/chubu-jukyu.csv?raw'
import chugoku from '../test/fixtures/chugoku-jukyu.csv?raw'
import hokkaido from '../test/fixtures/hokkaido-jukyu.csv?raw'
import hokuriku from '../test/fixtures/hokuriku-jukyu.csv?raw'
import kansai from '../test/fixtures/kansai-jukyu.csv?raw'
import shikoku from '../test/fixtures/shikoku-jukyu.csv?raw'
import tohoku from '../test/fixtures/tohoku-jukyu.csv?raw'
import { ADAPTERS } from './adapters'
import type { Area } from '../regions/areas'

/** The first two half hours and the last of the first day, cut from each company's file. */
const fixtures: [Area, string, string][] = [
  ['hokkaido', hokkaido, '2026-09-01'],
  ['tohoku', tohoku, '2026-08-01'],
  ['chubu', chubu, '2026-09-01'],
  ['hokuriku', hokuriku, '2026-09-01'],
  ['kansai', kansai, '2026-09-01'],
  ['chugoku', chugoku, '2026-09-01'],
  ['shikoku', shikoku, '2026-09-01'],
]

test.each(fixtures)(
  '%s publishes the shared layout: start-marked times, the sources summing to the demand',
  (area, csv, day) => {
    const adapter = ADAPTERS[area]!
    expect(adapter.area).toBe(area)
    expect(adapter.file('202609')).toBe(`${area}-jukyu-202609.csv`)
    const slots = adapter.parse(csv).get(day)!
    expect(slots.map((s) => s.slot)).toEqual([1, 2, 48])
    for (const s of slots) {
      const generated = Object.values(s.bySource).reduce((a, b) => a + b, 0)
      expect(Math.abs(generated - s.demandMW)).toBeLessThanOrEqual(2)
      expect(s.demandMW).toBeGreaterThan(1000)
    }
  },
)

test('Shikoku leaves the sources it has none of blank, which read as zero', () => {
  const [first] = ADAPTERS.shikoku!.parse(shikoku).get('2026-09-01')!
  expect(first.bySource.geothermal).toBe(0)
  expect(first.bySource.other).toBe(0)
  expect(first.bySource.interconnector).toBe(-1314)
})

test('the half hours a company lays out in advance and leaves blank are not slots', () => {
  const laidOut = hokkaido + '\n2026/9/30,23:30,,,,,,,,,,,,,,,,,,,,\n'
  expect(ADAPTERS.hokkaido!.parse(laidOut).has('2026-09-30')).toBe(false)
})
