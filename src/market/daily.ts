import { SLOTS, type PricedArea, type SpotSlot } from './jepx'
import type { RecordSlot } from './record'
import { SERIES, seriesMW, storageMW, type Series } from './stack'

/** A half hour's average MW over its half hour is half as many MWh. */
const HOURS_PER_SLOT = 0.5

/** The exchange's floor, ¥/kWh: a half hour cleared at it had more on offer than anyone would take. */
export const FLOOR_YEN = 0.01

/**
 * Tonnes of CO₂ per MWh for the fuel burnt at the plant, after CRIEPI's 2016 assessment of Japan's generation: coal 864,
 * oil 695 g/kWh, LNG between its steam plants' 476 and combined cycle's 376, which most of the fleet is, taken as 430.
 * The companies' other thermal column, mostly steelworks' gases, is taken as oil; biomass counts as none, as is usual.
 * An estimate from the fuel mix, not a measurement.
 */
export const CO2_T_PER_MWH = { coal: 0.864, lng: 0.43, oil: 0.695, otherThermal: 0.695 } as const

/** The sources that renew: sun, wind, water, the earth's heat and biomass. */
const RENEWABLE: readonly Series[] = ['solar', 'wind', 'hydro', 'renewables']

/** A day of an area, or of Japan, in energy: what was used, what supplied it, and its shape. */
export interface DayTotals {
  /** Half hours the day holds; a whole day is 48. */
  slots: number
  demandMWh: number
  bySeries: Record<Series, number>
  generatedMWh: number
  storageOutMWh: number
  storageInMWh: number
  importMWh: number
  exportMWh: number
  curtailedMWh: number
  /** CO₂ from the fuel the area burnt, tonnes, estimated; see CO2_T_PER_MWH. */
  co2t: number
  /** The highest and lowest half hour of demand, MW, and when. */
  peak: { mw: number; slot: number }
  low: { mw: number; slot: number }
}

const zeroSeries = () => Object.fromEntries(SERIES.map((s) => [s, 0])) as Record<Series, number>

export function dayTotals(day: readonly RecordSlot[]): DayTotals {
  const t: DayTotals = {
    slots: day.length,
    demandMWh: 0,
    bySeries: zeroSeries(),
    generatedMWh: 0,
    storageOutMWh: 0,
    storageInMWh: 0,
    importMWh: 0,
    exportMWh: 0,
    curtailedMWh: 0,
    co2t: 0,
    peak: { mw: -Infinity, slot: 0 },
    low: { mw: Infinity, slot: 0 },
  }
  for (const r of day) {
    const mw = seriesMW(r)
    for (const s of SERIES) {
      t.bySeries[s] += mw[s] * HOURS_PER_SLOT
      t.generatedMWh += mw[s] * HOURS_PER_SLOT
    }
    const storage = storageMW(r)
    const lines = r.bySource.interconnector
    t.demandMWh += r.demandMW * HOURS_PER_SLOT
    t.storageOutMWh += Math.max(0, storage) * HOURS_PER_SLOT
    t.storageInMWh += Math.max(0, -storage) * HOURS_PER_SLOT
    t.importMWh += Math.max(0, lines) * HOURS_PER_SLOT
    t.exportMWh += Math.max(0, -lines) * HOURS_PER_SLOT
    t.curtailedMWh += (r.curtailedMW.solar + r.curtailedMW.wind) * HOURS_PER_SLOT
    for (const [fuel, factor] of Object.entries(CO2_T_PER_MWH))
      t.co2t += Math.max(0, r.bySource[fuel as keyof typeof CO2_T_PER_MWH]) * factor * HOURS_PER_SLOT
    if (r.demandMW > t.peak.mw) t.peak = { mw: r.demandMW, slot: r.slot }
    if (r.demandMW < t.low.mw) t.low = { mw: r.demandMW, slot: r.slot }
  }
  return t
}

/**
 * Japan's day as the sum of its areas' whole days, or null unless every area has one. The imports and exports are the
 * areas' own, so between them they count what crossed the borders inside Japan, twice over; the sum keeps only the
 * losses as their difference and they are left out of it. The peak is Japan's own, from the areas' half hours summed.
 */
export function japanTotals(days: readonly (readonly RecordSlot[] | undefined)[]): DayTotals | null {
  if (!days.length || days.some((d) => d?.length !== SLOTS)) return null
  const areas = days.map((d) => dayTotals(d!))
  const t = dayTotals([])
  t.slots = SLOTS
  for (const a of areas) {
    t.demandMWh += a.demandMWh
    t.generatedMWh += a.generatedMWh
    t.storageOutMWh += a.storageOutMWh
    t.storageInMWh += a.storageInMWh
    t.curtailedMWh += a.curtailedMWh
    t.co2t += a.co2t
    for (const s of SERIES) t.bySeries[s] += a.bySeries[s]
  }
  for (let slot = 1; slot <= SLOTS; slot++) {
    const mw = days.reduce((sum, d) => sum + (d!.find((r) => r.slot === slot)?.demandMW ?? 0), 0)
    if (mw > t.peak.mw) t.peak = { mw, slot }
    if (mw < t.low.mw) t.low = { mw, slot }
  }
  return t
}

/** The CO₂ per kWh the area generated, grams, estimated: tonnes per MWh are kilograms per MWh a thousandfold, so grams per kWh. */
export const co2Intensity = (t: DayTotals) => (t.generatedMWh > 0 ? (t.co2t / t.generatedMWh) * 1000 : 0)

/** The share of the day's generation that came from renewable sources, 0 to 1. */
export function renewableShare(t: DayTotals): number {
  return t.generatedMWh > 0 ? RENEWABLE.reduce((sum, s) => sum + t.bySeries[s], 0) / t.generatedMWh : 0
}

/**
 * The day's price as the demand weighs it, ¥/kWh: each half hour's price by how much was used in it, so the evening
 * peak counts for more than the night. For Japan, each area's price by its own demand.
 */
export function weightedPrice(
  spot: readonly SpotSlot[] | undefined,
  demand: ReadonlyMap<PricedArea, readonly RecordSlot[]>,
): number | null {
  if (!spot?.length || !demand.size) return null
  let yen = 0
  let mwh = 0
  for (const [area, day] of demand)
    for (const r of day) {
      const price = spot.find((s) => s.slot === r.slot)?.areaPrice[area]
      if (price === undefined || !Number.isFinite(price)) continue
      yen += price * r.demandMW
      mwh += r.demandMW
    }
  return mwh > 0 ? yen / mwh : null
}

/** How many half hours of the day an area, or the system price when none is given, cleared at the floor. */
export function floorSlots(spot: readonly SpotSlot[] | undefined, area?: PricedArea): number {
  return (spot ?? []).filter((s) => (area ? s.areaPrice[area] : s.systemPrice) <= FLOOR_YEN).length
}
