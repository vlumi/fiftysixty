import { MapLibreOverlay } from '@deck.gl/maplibre'
import { Map as MapLibre, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useRef } from 'react'
import type { Regions } from '../regions/geometry'
import { DARK } from '../shared/palette'
import { JAPAN_BOUNDS, STYLE_URL } from './basemap'
import { buildLayers, type AreaPrices } from './layers'

// MapLibre 6 resolves its worker relative to its own script URL, which a bundled app does not provide.
setWorkerUrl(maplibreWorkerUrl)

const GEOMETRY_CREDIT =
  '<a href="https://www.gsi.go.jp/kankyochiri/gm_jpn.html">地球地図日本</a> (GSI) via dataofjapan/land'

/** The basemap over Japan with the market layers interleaved into it. */
export default function MapView({ regions, prices }: { regions: Regions | null; prices?: AreaPrices }) {
  const container = useRef<HTMLDivElement>(null)
  const overlay = useRef<MapLibreOverlay>(null)

  useEffect(() => {
    if (!container.current) return
    const map = new MapLibre({
      container: container.current,
      style: STYLE_URL,
      bounds: JAPAN_BOUNDS,
      attributionControl: { compact: true, customAttribution: GEOMETRY_CREDIT },
      canvasContextAttributes: { antialias: true },
    })
    map.addControl(new NavigationControl({ visualizePitch: false }), 'top-right')
    overlay.current = new MapLibreOverlay({ interleaved: true, layers: [] })
    map.addControl(overlay.current)
    return () => {
      overlay.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    overlay.current?.setProps({ layers: buildLayers(regions, DARK, prices) })
  }, [regions, prices])

  return <div ref={container} className="map" role="region" aria-label="Map" />
}
