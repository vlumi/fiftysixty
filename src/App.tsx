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
        <h1>50/60</h1>
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
