import { createContext, useContext } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { Fetched } from '../market/fetched'
import { monthOf } from '../market/record'
import { fetchTime, jepxFile, occtoFile, recordFile } from '../market/sources'
import type { Series } from '../market/stack'
import { AREA_BY_ID, type PricedArea } from '../regions/areas'
import { companyName } from '../regions/companies'
import { useApp } from '../store'
import { jstDateTime } from '../time/days'

/** The displayed day and the fetcher's note, which together name the file a figure came from and when the host took it. */
export const ProvenanceContext = createContext<{ date: string | null; fetched: Fetched | null }>({
  date: null,
  fetched: null,
})

/** JEPX's columns, as the file heads them. */
export const JEPX_FIELDS = {
  systemPrice: 'システムプライス(円/kWh)',
  areaPrice: (area: PricedArea) => `エリアプライス${AREA_BY_ID[area].ja}(円/kWh)`,
  areaPrices: 'エリアプライス(円/kWh)',
  sell: '売り入札量(kWh)',
  buy: '買い入札量(kWh)',
  volume: '約定総量(kWh)',
}

/** The records' columns behind each row of the supply key and the day's figures. */
export const RECORD_FIELDS: Record<Series | 'demand' | 'curtailed' | 'storage' | 'lines', string> = {
  demand: 'エリア需要',
  curtailed: '太陽光出力制御量, 風力出力制御量',
  storage: '揚水, 蓄電池',
  lines: '連系線',
  coal: '火力(石炭)',
  nuclear: '原子力',
  renewables: '地熱, バイオマス',
  otherThermal: '火力(石油), 火力(その他), その他',
  solar: '太陽光発電実績',
  wind: '風力発電実績',
  gas: '火力(LNG)',
  hydro: '水力',
}

/** OCCTO's columns behind a line's row. */
export const OCCTO_FIELDS = {
  flow: '順方向予想潮流(MW)',
  capacity: '順方向運用容量(MW), 逆方向運用容量(MW)',
  split: '順方向分断情報, 逆方向分断情報',
}

/** The tooltip on a figure's label: the file and the field it comes from, or its formula, and when the host fetched the file. */
export interface Provenance {
  jepx: (field: string, note?: string) => string
  record: (area: PricedArea, field: string, note?: string) => string
  records: (areas: readonly PricedArea[], field: string, note?: string) => string
  occto: (field: string, note?: string) => string
  derived: (formula: string) => string
}

export function useProvenance(): Provenance {
  const { date, fetched } = useContext(ProvenanceContext)
  const s = useStrings().readout.source
  const lang = useApp((x) => x.lang)
  const when = (at: string | null) => (at ? s.fetched(jstDateTime(new Date(at))) : null)
  const lines = (...parts: (string | null)[]) => parts.filter(Boolean).join('\n')
  const from = (file: string | null, field: string, note?: string) =>
    [file, field].filter(Boolean).join(' · ') + (note ? `, ${note}` : '')
  return {
    jepx: (field, note) => {
      const file = date && jepxFile(date)
      return lines(from(file, field, note), file && when(fetchTime(fetched, file)))
    },
    record: (area, field, note) => {
      const file = date && recordFile(area, date)
      return lines(companyName(area, lang), from(file, field, note), file && when(fetchTime(fetched, file)))
    },
    records: (areas, field, note) => {
      const times = date ? areas.map((a) => fetchTime(fetched, recordFile(a, date))).filter((t) => t !== null) : []
      const newest = times.length ? times.reduce((a, b) => (b > a ? b : a)) : null
      const files = date && s.eachArea(`<area>-jukyu-${monthOf(date)}.csv`)
      return lines(from(files, field, note ?? s.summed), newest && s.newestFetched(jstDateTime(new Date(newest))))
    },
    occto: (field, note) => {
      const file = date && occtoFile(date)
      return lines(from(file, field, note), file && when(fetchTime(fetched, file)))
    },
    derived: (formula) => `${s.derivedWhen}: ${formula}`,
  }
}
