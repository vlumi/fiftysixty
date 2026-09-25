import { MapLibreOverlay } from '@deck.gl/maplibre'
import { Map as MapLibre, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useRef } from 'react'
import type { Area } from '../regions/areas'
import type { AreaProps, Regions } from '../regions/geometry'
import { DARK } from '../shared/palette'
import { JAPAN_BOUNDS, STYLE_URL } from './basemap'
import { buildLayers, type LayerOptions } from './layers'

// MapLibre 6 resolves its worker relative to its own script URL, which a bundled app does not provide.
setWorkerUrl(maplibreWorkerUrl)

const GEOMETRY_CREDIT =
  '<a href="https://www.gsi.go.jp/kankyochiri/gm_jpn.html">地球地図日本</a> (GSI) via dataofjapan/land'

interface Props extends LayerOptions {
  regions: Regions | null
  /** A click on an area, or on the sea for none. */
  onPick: (area: Area | null) => void
}

/** The basemap over Japan with the market layers interleaved into it. */
export default function MapView({ regions, prices, selected, onPick }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const overlay = useRef<MapLibreOverlay>(null)
  const pick = useRef(onPick)
  useEffect(() => {
    pick.current = onPick
  }, [onPick])

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
    overlay.current = new MapLibreOverlay({
      interleaved: true,
      layers: [],
      onClick: (info) => pick.current((info.object as { properties: AreaProps } | undefined)?.properties.area ?? null),
      getCursor: ({ isHovering, isDragging }) => (isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'),
    })
    map.addControl(overlay.current)
    return () => {
      overlay.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    overlay.current?.setProps({ layers: buildLayers(regions, DARK, { prices, selected }) })
  }, [regions, prices, selected])

  return <div ref={container} className="map" role="region" aria-label="Map" />
}
