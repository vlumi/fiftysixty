import { lazy, Suspense } from 'react'

const MapView = lazy(() => import('./map/MapView'))

export default function App() {
  return (
    <>
      <header>
        <h1>50/60</h1>
        <p>The Japanese power market on a map</p>
      </header>
      <main>
        <Suspense fallback={null}>
          <MapView />
        </Suspense>
      </main>
    </>
  )
}
