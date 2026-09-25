import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ADAPTERS } from './market/adapters'
import { flowsAt, loadFlows, type FlowDays } from './market/flows'
import { fiscalYear, loadSpotYears, slotOf, type SpotDays } from './market/jepx'
import { stories } from './market/stories'
import { loadRecord, monthOf, recordSlot, type RecordDays, type RecordSlot } from './market/record'
import type { Area } from './regions/areas'
import Legend from './panels/Legend'
import Readout from './panels/Readout'
import { loadRegions, type Regions } from './regions/geometry'
import { loadPlants, type Plants } from './regions/plants'
import { useApp } from './store'
import { jstDate, openingDay } from './time/days'
import TimeBar from './time/TimeBar'
import { useNow } from './time/useNow'
import { usePlayer } from './time/usePlayer'

const MapView = lazy(() => import('./map/MapView'))

const REFRESH_MS = 30 * 60_000

export default function App() {
  const [regions, setRegions] = useState<Regions | null>(null)
  const [plants, setPlants] = useState<Plants | null>(null)
  const [spot, setSpot] = useState<SpotDays | null>(null)
  const [records, setRecords] = useState<ReadonlyMap<string, RecordDays | null>>(new Map())
  const [flowMonths, setFlowMonths] = useState<ReadonlyMap<string, FlowDays | null>>(new Map())
  useEffect(() => {
    loadRegions().then(setRegions, console.error)
    loadPlants().then(setPlants, console.error)
    loadSpotYears(fiscalYear(jstDate(new Date()))).then(setSpot, console.error)
  }, [])

  const chosenDate = useApp((s) => s.date)
  const slot = useApp((s) => s.slot)
  const setDate = useApp((s) => s.setDate)
  const setSlot = useApp((s) => s.setSlot)
  const area = useApp((s) => s.area)
  const selectArea = useApp((s) => s.selectArea)
  const plantId = useApp((s) => s.plant)
  const pickPlant = useApp((s) => s.pickPlant)
  const plant = useMemo(
    () => plants?.features.find((f) => f.properties.id === plantId)?.properties ?? null,
    [plants, plantId],
  )
  const playing = useApp((s) => s.playing)
  const togglePlay = useApp((s) => s.togglePlay)
  const step = useApp((s) => s.step)
  const now = useNow()
  const date = chosenDate ?? openingDay(spot, now)
  const days = useMemo(() => (spot ? [...spot.keys()].sort() : []), [spot])
  const storyDays = useMemo(() => stories(spot), [spot])
  const tick = useCallback(() => step(days, date), [step, days, date])
  usePlayer(playing, tick)
  const displayed = slotOf(spot, date, slot)

  // The displayed month's files, asked for again every half hour so an open tab follows the host's hourly fetch,
  // and again after a failure.
  const month = date ? monthOf(date) : null
  const askedAt = useRef(new Map<string, number>())
  useEffect(() => {
    if (!month) return
    const ask = (key: string, load: () => Promise<void>) => {
      const at = askedAt.current.get(key)
      if (at !== undefined && now.getTime() - at < REFRESH_MS) return
      askedAt.current.set(key, now.getTime())
      load().catch((error: unknown) => {
        console.error(error)
        askedAt.current.delete(key)
      })
    }
    for (const adapter of Object.values(ADAPTERS)) {
      const key = `${adapter.area}/${month}`
      ask(key, () => loadRecord(adapter, month).then((days) => setRecords((r) => new Map(r).set(key, days))))
    }
    ask(`flows/${month}`, () => loadFlows(month).then((days) => setFlowMonths((f) => new Map(f).set(month, days))))
  }, [month, now])
  const flows = useMemo(
    () => flowsAt(month ? flowMonths.get(month) : null, date, slot),
    [flowMonths, month, date, slot],
  )
  const recordFor = (a: Area | null) => (a && month ? records.get(`${a}/${month}`) : undefined)
  const record = recordSlot(recordFor(area), date, slot)
  const recordedDay = date ? recordFor(area)?.get(date) : undefined
  const mixes = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(ADAPTERS).flatMap((a) => {
          const at = recordSlot(a && month ? records.get(`${a}/${month}`) : undefined, date, slot)
          return at ? [[a, at]] : []
        }),
      ) as Partial<Record<Area, RecordSlot>>,
    [records, month, date, slot],
  )

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
            plants={plants}
            selectedPlant={plantId}
            mixes={mixes}
            onPick={selectArea}
            onPickPlant={pickPlant}
          />
        </Suspense>
        <Readout
          slot={displayed}
          record={record}
          day={recordedDay}
          flows={flows}
          area={area}
          plant={plant}
          onClose={() => (plant ? pickPlant(null) : selectArea(null))}
          onSlot={setSlot}
        />
        <TimeBar
          date={date}
          days={days}
          slot={slot}
          now={now}
          playing={playing}
          stories={storyDays}
          onDate={setDate}
          onSlot={setSlot}
          onPlay={togglePlay}
        />
        <Legend />
      </main>
    </>
  )
}
