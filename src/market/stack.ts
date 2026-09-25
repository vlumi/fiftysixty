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

/** Storage and the interconnectors as one signed figure: what the area took in or sent out beyond what it generated. */
export const exchangeMW = (slot: RecordSlot) =>
  slot.bySource.pumped + slot.bySource.battery + slot.bySource.interconnector

/** A slot of the day laid out for the chart: the running top of each band, from the bottom up. */
export interface StackedSlot {
  slot: number
  demandMW: number
  /** For each series, the MW under it and its own MW: the band runs from `from` to `from + value`. */
  bands: Record<Series, { from: number; value: number }>
  generatedMW: number
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
      exchangeMW: exchangeMW(r),
      curtailedMW: r.curtailedMW.solar + r.curtailedMW.wind,
    }
  })
  const tops = slots.flatMap((s) => [s.demandMW, s.generatedMW + Math.max(0, s.exchangeMW) + s.curtailedMW])
  const bottoms = slots.map((s) => Math.min(0, s.exchangeMW))
  return {
    slots,
    minMW: Math.floor(Math.min(0, ...bottoms) / GW) * GW,
    maxMW: Math.ceil(Math.max(GW, ...tops) / GW) * GW,
  }
}
