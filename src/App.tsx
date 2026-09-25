import { lazy, Suspense, useEffect, useState } from 'react'
import { fiscalYear, latestDay, loadSpot, slotOf, type SpotDays } from './market/jepx'
import Legend from './panels/Legend'
import Readout from './panels/Readout'
import { loadRegions, type Regions } from './regions/geometry'
import { useApp } from './store'
import TimeBar from './time/TimeBar'

const MapView = lazy(() => import('./map/MapView'))

export default function App() {
  const [regions, setRegions] = useState<Regions | null>(null)
  const [spot, setSpot] = useState<SpotDays | null>(null)
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
  const date = chosenDate ?? latestDay(spot)
  const days = spot ? [...spot.keys()].sort() : []
  const displayed = slotOf(spot, date, slot)

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
          <MapView regions={regions} prices={displayed?.areaPrice} selected={area} onPick={selectArea} />
        </Suspense>
        <Readout slot={displayed} area={area} onClose={() => selectArea(null)} />
        <TimeBar date={date} days={days} slot={slot} onDate={setDate} onSlot={setSlot} />
        <Legend />
      </main>
    </>
  )
}
