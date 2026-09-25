import { lazy, Suspense, useEffect, useState } from 'react'
import { loadRegions, type Regions } from './regions/geometry'

const MapView = lazy(() => import('./map/MapView'))

export default function App() {
  const [regions, setRegions] = useState<Regions | null>(null)
  useEffect(() => {
    loadRegions().then(setRegions, console.error)
  }, [])

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
          <MapView regions={regions} />
        </Suspense>
      </main>
    </>
  )
}
