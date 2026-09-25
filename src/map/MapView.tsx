import { Map as MapLibre, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import { JAPAN_BOUNDS, STYLE_URL } from './basemap'

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
