import type { Area } from '../regions/areas'
import type { PricedArea, SpotSlot } from './jepx'
import { SOURCES, type RecordSlot } from './record'
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
 * Japan's day from the areas that recorded it: every half hour the areas' records summed, for one set of areas all day,
 * those with any record of it, so no line jumps when an area's half hours stop; and the areas left out, by name. The
 * interconnectors are left at none: between the areas they cancel, and what they do not is the loss on the way.
 */
export interface JapanDay {
  slots: RecordSlot[]
  /** The areas with no record of the day, left out of every sum. */
  missing: Area[]
}

export function japanDay(days: ReadonlyMap<Area, readonly RecordSlot[]>, areas: readonly Area[]): JapanDay {
  const present = areas.filter((a) => days.get(a)?.length)
  const missing = areas.filter((a) => !present.includes(a))
  if (!present.length) return { slots: [], missing }
  const bySlot = present.map((a) => new Map(days.get(a)!.map((r) => [r.slot, r])))
  const slots = [...bySlot[0].keys()].filter((slot) => bySlot.every((m) => m.has(slot))).sort((a, b) => a - b)
  return {
    missing,
    slots: slots.map((slot) => {
      const rows = bySlot.map((m) => m.get(slot)!)
      const bySource = Object.fromEntries(
        SOURCES.map((x) => [x, x === 'interconnector' ? 0 : rows.reduce((sum, r) => sum + r.bySource[x], 0)]),
      ) as RecordSlot['bySource']
      return {
        slot,
        demandMW: rows.reduce((sum, r) => sum + r.demandMW, 0),
        bySource,
        curtailedMW: {
          solar: rows.reduce((sum, r) => sum + r.curtailedMW.solar, 0),
          wind: rows.reduce((sum, r) => sum + r.curtailedMW.wind, 0),
        },
      }
    }),
  }
}

/** Japan's day in energy from its summed half hours, or null when no area has recorded it. */
export function japanTotals(japan: JapanDay): DayTotals | null {
  return japan.slots.length ? dayTotals(japan.slots) : null
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
