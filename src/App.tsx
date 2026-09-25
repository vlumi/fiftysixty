import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ADAPTERS } from './market/adapters'
import { flowsAt, loadFlows, type FlowDays } from './market/flows'
import { fiscalYear, loadSpot, slotOf, type SpotDays } from './market/jepx'
import { loadRecord, monthOf, recordSlot, type RecordDays, type RecordSlot } from './market/record'
import type { Area } from './regions/areas'
import Legend from './panels/Legend'
import Readout from './panels/Readout'
import { loadRegions, type Regions } from './regions/geometry'
import { useApp } from './store'
import { openingDay } from './time/days'
import TimeBar from './time/TimeBar'
import { useNow } from './time/useNow'
import { usePlayer } from './time/usePlayer'

const MapView = lazy(() => import('./map/MapView'))

export default function App() {
  const [regions, setRegions] = useState<Regions | null>(null)
  const [spot, setSpot] = useState<SpotDays | null>(null)
  const [records, setRecords] = useState<ReadonlyMap<string, RecordDays | null>>(new Map())
  const [flowMonths, setFlowMonths] = useState<ReadonlyMap<string, FlowDays | null>>(new Map())
  useEffect(() => {
    loadRegions().then(setRegions, console.error)
    loadSpot(fiscalYear(new Date())).then(setSpot, console.error)
  }, [])

  const chosenDate = useApp((s) => s.date)
  const slot = useApp((s) => s.slot)
  const setDate = useApp((s) => s.setDate)
  const setSlot = useApp((s) => s.setSlot)
  const area = useApp((s) => s.area)
  const selectArea = useApp((s) => s.selectArea)
  const playing = useApp((s) => s.playing)
  const togglePlay = useApp((s) => s.togglePlay)
  const step = useApp((s) => s.step)
  const now = useNow()
  const date = chosenDate ?? openingDay(spot, now)
  const days = useMemo(() => (spot ? [...spot.keys()].sort() : []), [spot])
  const tick = useCallback(() => step(days, date), [step, days, date])
  usePlayer(playing, tick)
  const displayed = slotOf(spot, date, slot)

  const month = date ? monthOf(date) : null
  const requested = useRef(new Set<string>())
  useEffect(() => {
    if (!month) return
    for (const adapter of Object.values(ADAPTERS)) {
      const key = `${adapter.area}/${month}`
      if (requested.current.has(key)) continue
      requested.current.add(key)
      loadRecord(adapter, month).then((days) => setRecords((r) => new Map(r).set(key, days)), console.error)
    }
    if (!requested.current.has(`flows/${month}`)) {
      requested.current.add(`flows/${month}`)
      loadFlows(month).then((days) => setFlowMonths((f) => new Map(f).set(month, days)), console.error)
    }
  }, [month])
  const flows = flowsAt(month ? flowMonths.get(month) : null, date, slot)
  const recordFor = (a: Area | null) => (a && month ? records.get(`${a}/${month}`) : undefined)
  const record = recordSlot(recordFor(area), date, slot)
  const recordedDay = date ? recordFor(area)?.get(date) : undefined
  const mixes = Object.fromEntries(
    Object.keys(ADAPTERS).flatMap((a) => {
      const at = recordSlot(recordFor(a as Area), date, slot)
      return at ? [[a, at]] : []
    }),
  ) as Partial<Record<Area, RecordSlot>>

  return (
    <>
      <header>
        <h1>
          <span className="hz50">50</span>
          <span className="slash">/</span>
          <span className="hz60">60</span>
        </h1>
        <p>The Japanese power market on a map</p>
      </header>
      <main>
        <Suspense fallback={null}>
          <MapView
            regions={regions}
            prices={displayed?.areaPrice}
            selected={area}
            flows={flows}
            mixes={mixes}
            onPick={selectArea}
          />
        </Suspense>
        <Readout
          slot={displayed}
          record={record}
          day={recordedDay}
          flows={flows}
          area={area}
          onClose={() => selectArea(null)}
          onSlot={setSlot}
        />
        <TimeBar
          date={date}
          days={days}
          slot={slot}
          now={now}
          playing={playing}
          onDate={setDate}
          onSlot={setSlot}
          onPlay={togglePlay}
        />
        <Legend />
      </main>
    </>
  )
}
