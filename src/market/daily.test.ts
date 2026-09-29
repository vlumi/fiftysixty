import csv from '../test/fixtures/tepco-jukyu.csv?raw'
import spotCsv from '../test/fixtures/jepx-spot.csv?raw'
import { co2Intensity, dayTotals, floorSlots, japanDay, japanTotals, renewableShare, weightedPrice } from './daily'
import { parseSpot } from './jepx'
import type { RecordSlot } from './record'
import { SERIES } from './stack'
import { TEPCO } from './tepco'

const day = TEPCO.parse(csv).get('2026-09-24')!

test("a whole day in energy: half an hour's MW is half as many MWh, and the day balances", () => {
  const t = dayTotals(day)
  expect(t.slots).toBe(48)
  expect(t.demandMWh).toBeCloseTo(day.reduce((sum, r) => sum + r.demandMW, 0) / 2)
  expect(SERIES.reduce((sum, s) => sum + t.bySeries[s], 0)).toBeCloseTo(t.generatedMWh)
  const supplied = t.generatedMWh + t.storageOutMWh - t.storageInMWh + t.importMWh - t.exportMWh
  expect(Math.abs(supplied - t.demandMWh)).toBeLessThan(0.001 * t.demandMWh)
  expect(t.peak.mw).toBe(Math.max(...day.map((r) => r.demandMW)))
  expect(t.low.mw).toBe(Math.min(...day.map((r) => r.demandMW)))
  expect(renewableShare(t)).toBeGreaterThan(0)
  expect(renewableShare(t)).toBeLessThan(1)
})

test("Japan's day is its areas' whole days summed, its peak Japan's own; with an area short of a day there is none", () => {
  const shifted = day.map((r): RecordSlot => ({ ...r, slot: ((r.slot + 23) % 48) + 1 }))
  const japan = japanTotals([day, shifted])!
  expect(japan.demandMWh).toBeCloseTo(dayTotals(day).demandMWh * 2)
  expect(japan.peak.mw).toBeLessThan(dayTotals(day).peak.mw * 2)
  expect(japan.importMWh).toBe(0)
  expect(japanTotals([day, day.slice(0, 47)])).toBeNull()
  expect(japanTotals([day, undefined])).toBeNull()
})

test('the price as the demand weighs it, and the half hours at the floor', () => {
  // The fixture has no prices for the 24th; the 25th's stand in, since only the weighting is under test.
  const spot = parseSpot(spotCsv).get('2026-09-25')!
  const price = weightedPrice(spot, new Map([['tokyo', day]]))!
  const prices = spot.map((s) => s.areaPrice.tokyo)
  expect(price).toBeGreaterThanOrEqual(Math.min(...prices))
  expect(price).toBeLessThanOrEqual(Math.max(...prices))
  expect(weightedPrice(undefined, new Map([['tokyo', day]]))).toBeNull()
  expect(floorSlots([{ ...spot[0], systemPrice: 0.01 }, spot[1]])).toBe(1)
})

test('CO₂ is estimated from the fuel burnt, each fuel by its factor, and per kWh generated lies between gas and coal', () => {
  const t = dayTotals(day)
  const byHand = day.reduce(
    (sum, r) =>
      sum +
      (r.bySource.coal * 0.864 + r.bySource.lng * 0.43 + r.bySource.oil * 0.695 + r.bySource.otherThermal * 0.695) / 2,
    0,
  )
  expect(t.co2t).toBeCloseTo(byHand)
  expect(co2Intensity(t)).toBeGreaterThan(0)
  expect(co2Intensity(t)).toBeLessThan(864)
  expect(japanTotals([day, day])!.co2t).toBeCloseTo(t.co2t * 2)
})

test("Japan's half hours are the areas' summed, only those every area has, the interconnectors cancelled", () => {
  const japan = japanDay([day, day.slice(0, 30)])
  expect(japan.map((r) => r.slot)).toEqual(day.slice(0, 30).map((r) => r.slot))
  expect(japan[0].demandMW).toBe(day[0].demandMW * 2)
  expect(japan[0].bySource.coal).toBe(day[0].bySource.coal * 2)
  expect(japan[0].bySource.interconnector).toBe(0)
  expect(japanDay([day, undefined])).toEqual([])
})
