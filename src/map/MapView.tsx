import { Map as MapLibre, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useRef } from 'react'
import { JAPAN_BOUNDS, STYLE_URL } from './basemap'

// MapLibre 6 resolves its worker relative to its own script URL, which a bundled app does not provide.
setWorkerUrl(maplibreWorkerUrl)

/** The basemap over Japan; the market layers land on it in the milestones that follow. */
export default function MapView() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    const map = new MapLibre({
      container: container.current,
      style: STYLE_URL,
      bounds: JAPAN_BOUNDS,
      attributionControl: { compact: true },
    })
    map.addControl(new NavigationControl({ visualizePitch: false }), 'top-right')
    return () => map.remove()
  }, [])

  return <div ref={container} className="map" role="region" aria-label="Map" />
}
