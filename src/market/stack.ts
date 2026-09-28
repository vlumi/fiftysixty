import type { RecordSlot } from './record'

/** The record's sources grouped for the chart, in stack order from the bottom; the order keeps neighbors apart under color-blindness. */
export const SERIES = ['coal', 'nuclear', 'renewables', 'otherThermal', 'solar', 'wind', 'gas', 'hydro'] as const

export type Series = (typeof SERIES)[number]

export function seriesMW(slot: RecordSlot): Record<Series, number> {
  const s = slot.bySource
  return {
    coal: s.coal,
    nuclear: s.nuclear,
    renewables: s.geothermal + s.biomass,
    otherThermal: s.oil + s.otherThermal + s.other,
    solar: s.solar,
    wind: s.wind,
    gas: s.lng,
    hydro: s.hydro,
  }
}

/** Pumped storage and batteries as one signed figure, positive when they generate, negative when they charge. */
export const storageMW = (slot: RecordSlot) => slot.bySource.pumped + slot.bySource.battery

/** Storage and the interconnectors as one signed figure: what the area took in or sent out beyond what it generated. */
export const exchangeMW = (slot: RecordSlot) => storageMW(slot) + slot.bySource.interconnector

const positive = (mw: number) => Math.max(0, mw)
const negative = (mw: number) => Math.min(0, mw)

/** What storage and the lines add on top of the generation: storage generating, then imports. */
export const aboveMW = (s: StackedSlot) => positive(s.storageMW) + positive(s.linesMW)

/** What went below the zero line: storage charging, then exports, as a negative figure. */
export const belowMW = (s: StackedSlot) => negative(s.storageMW) + negative(s.linesMW)

/** A slot of the day laid out for the chart: the running top of each band, from the bottom up. */
export interface StackedSlot {
  slot: number
  demandMW: number
  /** For each series, the MW under it and its own MW: the band runs from `from` to `from + value`. */
  bands: Record<Series, { from: number; value: number }>
  generatedMW: number
  /** Pumped storage and batteries, positive generating, negative charging. */
  storageMW: number
  /** The interconnectors, positive importing, negative exporting. */
  linesMW: number
  exchangeMW: number
  curtailedMW: number
}

export interface DayStack {
  slots: StackedSlot[]
  /** The y range in MW, rounded outward to whole gigawatts, zero always inside. */
  minMW: number
  maxMW: number
}

const GW = 1000

export function stackDay(day: readonly RecordSlot[]): DayStack {
  const slots = day.map((r) => {
    const mw = seriesMW(r)
    let from = 0
    const bands = {} as StackedSlot['bands']
    for (const s of SERIES) {
      bands[s] = { from, value: mw[s] }
      from += mw[s]
    }
    return {
      slot: r.slot,
      demandMW: r.demandMW,
      bands,
      generatedMW: from,
      storageMW: storageMW(r),
      linesMW: r.bySource.interconnector,
      exchangeMW: exchangeMW(r),
      curtailedMW: r.curtailedMW.solar + r.curtailedMW.wind,
    }
  })
  const tops = slots.flatMap((s) => [s.demandMW, s.generatedMW + aboveMW(s) + s.curtailedMW])
  const bottoms = slots.map(belowMW)
  return {
    slots,
    minMW: Math.floor(Math.min(0, ...bottoms) / GW) * GW,
    maxMW: Math.ceil(Math.max(GW, ...tops) / GW) * GW,
  }
}
