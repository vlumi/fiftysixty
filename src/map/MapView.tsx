import { MapLibreOverlay } from '@deck.gl/maplibre'
import { Map as MapLibre, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { RecordSlot } from '../market/record'
import { AREA_BY_ID, type Area } from '../regions/areas'
import type { AreaProps, Regions } from '../regions/geometry'
import { DARK } from '../shared/palette'
import { JAPAN_BOUNDS, STYLE_URL } from './basemap'
import { buildLayers, type LayerOptions } from './layers'
import MixGlyph from './MixGlyph'

// MapLibre 6 resolves its worker relative to its own script URL, which a bundled app does not provide.
setWorkerUrl(maplibreWorkerUrl)

const GEOMETRY_CREDIT =
  '<a href="https://www.gsi.go.jp/kankyochiri/gm_jpn.html">地球地図日本</a> (GSI) via dataofjapan/land'

interface Props extends LayerOptions {
  regions: Regions | null
  /** What ran in each recorded area for the displayed slot, drawn as a glyph beside it. */
  mixes?: Partial<Record<Area, RecordSlot>>
  /** A click on an area, or on the sea for none. */
  onPick: (area: Area | null) => void
}

/** The basemap over Japan with the market layers interleaved into it. */
export default function MapView({ regions, prices, selected, flows, mixes = {}, onPick }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const overlay = useRef<MapLibreOverlay>(null)
  const [map, setMap] = useState<MapLibre | null>(null)
  const [zoom, setZoom] = useState(5)
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
    setMap(map)
    setZoom(map.getZoom())
    map.on('zoom', () => setZoom(map.getZoom()))
    overlay.current = new MapLibreOverlay({
      interleaved: true,
      layers: [],
      onClick: (info) => pick.current((info.object as { properties: AreaProps } | undefined)?.properties.area ?? null),
      getCursor: ({ isHovering, isDragging }) => (isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'),
    })
    map.addControl(overlay.current)
    return () => {
      overlay.current = null
      setMap(null)
      map.remove()
    }
  }, [])

  useEffect(() => {
    overlay.current?.setProps({ layers: buildLayers(regions, DARK, { prices, selected, flows, zoom }) })
  }, [regions, prices, selected, flows, zoom])

  return (
    <>
      <div ref={container} className="map" role="region" aria-label="Map" />
      {map &&
        (Object.entries(mixes) as [Area, RecordSlot][]).map(([area, record]) => (
          <AreaMarker key={area} map={map} area={area}>
            <MixGlyph name={AREA_BY_ID[area].name} record={record} onPick={() => pick.current(area)} />
          </AreaMarker>
        ))}
    </>
  )
}

/** A MapLibre marker centered on the area's anchor, its content rendered by React through a portal. */
function AreaMarker({ map, area, children }: { map: MapLibre; area: Area; children: React.ReactNode }) {
  const [element] = useState(() => document.createElement('div'))
  useEffect(() => {
    const marker = new Marker({ element, anchor: 'center' }).setLngLat([...AREA_BY_ID[area].anchor]).addTo(map)
    return () => {
      marker.remove()
    }
  }, [map, area, element])
  return createPortal(children, element)
}
