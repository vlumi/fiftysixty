import csv from '../test/fixtures/tepco-jukyu.csv?raw'
import { exchangeMW, seriesMW, stackDay } from './stack'
import { TEPCO } from './tepco'

const day = TEPCO.parse(csv).get('2026-09-24')!
const noon = day[24]

test('the sources group into the chart series and the exchange is signed', () => {
  expect(seriesMW(noon)).toEqual({
    coal: 5298,
    nuclear: 1299,
    renewables: 396,
    otherThermal: 340 + 1046 + 310,
    solar: 14519,
    wind: 125,
    gas: 9529,
    hydro: 1960,
  })
  expect(exchangeMW(noon)).toBe(-2260 + 0 + 4305)
})

test('the bands stack from the bottom and the range rounds out to gigawatts around zero', () => {
  const stack = stackDay(day)
  expect(stack.slots).toHaveLength(48)
  const at = stack.slots[24]
  expect(at.bands.coal).toEqual({ from: 0, value: 5298 })
  expect(at.bands.nuclear).toEqual({ from: 5298, value: 1299 })
  expect(at.bands.hydro.from + at.bands.hydro.value).toBe(at.generatedMW)
  expect(at.generatedMW + at.exchangeMW).toBe(at.demandMW)
  expect(stack.minMW).toBeLessThanOrEqual(0)
  expect(stack.minMW % 1000).toBe(0)
  expect(stack.maxMW).toBeGreaterThanOrEqual(Math.max(...day.map((r) => r.demandMW)))
  expect(stack.maxMW % 1000).toBe(0)
})

test('a partial day stacks what there is', () => {
  const stack = stackDay(TEPCO.parse(csv).get('2026-09-25')!)
  expect(stack.slots.map((s) => s.slot)).toEqual([1, 2, 3])
})
