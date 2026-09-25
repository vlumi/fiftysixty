import csv from '../test/fixtures/tepco-jukyu.csv?raw'
import { monthOf, recordSlot } from './record'
import { TEPCO } from './tepco'

test('a real day parses into 48 slots and the newest, partial day into what has been published', () => {
  const days = TEPCO.parse(csv)
  expect([...days.keys()]).toEqual(['2026-09-24', '2026-09-25'])
  expect(days.get('2026-09-24')).toHaveLength(48)
  expect(days.get('2026-09-25')).toHaveLength(3)
  expect(recordSlot(days, '2026-09-24', 25)).toEqual({
    slot: 25,
    demandMW: 36867,
    bySource: {
      nuclear: 1299,
      lng: 9529,
      coal: 5298,
      oil: 340,
      otherThermal: 1046,
      hydro: 1960,
      geothermal: 0,
      biomass: 396,
      solar: 14519,
      wind: 125,
      pumped: -2260,
      battery: 0,
      interconnector: 4305,
      other: 310,
    },
    curtailedMW: { solar: 0, wind: 0 },
  })
})

test('a file without the header is refused', () => {
  expect(() => TEPCO.parse('単位[MW平均]\n2026/9/1,0:00,1')).toThrow('header')
})

test('the file for a month', () => {
  expect(TEPCO.file(monthOf('2026-09-24'))).toBe('tepco-jukyu-202609.csv')
})
