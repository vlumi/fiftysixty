import { MapLibreOverlay } from '@deck.gl/maplibre'
import { Map as MapLibre, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { RecordSlot } from '../market/record'
import { AREA_BY_ID, type Area } from '../regions/areas'
import type { PlantProps } from '../regions/plants'
import type { AreaProps, Regions } from '../regions/geometry'
import { PALETTES } from '../shared/palette'
import type { Lang } from '../i18n/strings'
import { BASEMAPS, BELOW_LABELS, type Theme } from '../shared/theme'
import { JAPAN_BOUNDS } from './basemap'
import { buildLayers, type LayerOptions } from './layers'
import MixGlyph from './MixGlyph'

// MapLibre 6 resolves its worker relative to its own script URL, which a bundled app does not provide.
setWorkerUrl(maplibreWorkerUrl)

interface Props extends LayerOptions {
  theme: Theme
  /** The basemap's labels and the areas' names come in this language. */
  lang: Lang
  regions: Regions | null
  /** What ran in each recorded area for the displayed slot, drawn as a glyph beside it. */
  mixes?: Partial<Record<Area, RecordSlot>>
  /** A click on an area, or on the sea for none. */
  onPick: (area: Area | null) => void
  /** A click on a plant's dot. */
  onPickPlant: (id: string) => void
}

/** The basemap over Japan with the market layers interleaved into it. */
export default function MapView({
  theme,
  lang,
  regions,
  prices,
  selected,
  flows,
  plants,
  selectedPlant,
  hiddenFuels,
  mixes = {},
  onPick,
  onPickPlant,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const overlay = useRef<MapLibreOverlay>(null)
  const [map, setMap] = useState<MapLibre | null>(null)
  const [zoom, setZoom] = useState(5)
  // The theme the basemap was styled for last; the map is created with it and restyled when it changes.
  const styled = useRef(theme)
  const pick = useRef({ onPick, onPickPlant, lang })
  useEffect(() => {
    pick.current = { onPick, onPickPlant, lang }
  }, [onPick, onPickPlant, lang])

  useEffect(() => {
    if (!container.current) return
    const map = new MapLibre({
      container: container.current,
      style: BASEMAPS[styled.current],
      bounds: JAPAN_BOUNDS,
      attributionControl: false,
      canvasContextAttributes: { antialias: true },
    })
    map.addControl(new NavigationControl({ visualizePitch: false }), 'top-right')
    map.on('style.load', () => labelLanguage(map, pick.current.lang))
    setMap(map)
    setZoom(map.getZoom())
    map.on('zoom', () => {
      setZoom(map.getZoom())
    })
    overlay.current = new MapLibreOverlay({
      interleaved: true,
      layers: [],
      onClick: (info) => {
        const properties = (info.object as { properties?: Partial<AreaProps & PlantProps> } | undefined)?.properties
        if (properties?.fuel && properties.id) pick.current.onPickPlant(properties.id)
        else pick.current.onPick(properties?.area ?? null)
      },
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
    if (map?.isStyleLoaded()) labelLanguage(map, lang)
  }, [map, lang])

  // The basemap follows the theme; the overlay re-adds its layers when the new style has loaded.
  useEffect(() => {
    if (!map || styled.current === theme) return
    styled.current = theme
    map.setStyle(BASEMAPS[theme])
  }, [map, theme])

  useEffect(() => {
    overlay.current?.setProps({
      layers: buildLayers(regions, PALETTES[theme], {
        prices,
        selected,
        flows,
        zoom,
        plants,
        selectedPlant,
        hiddenFuels,
        beforeId: BELOW_LABELS[theme],
      }),
    })
  }, [theme, regions, prices, selected, flows, zoom, plants, selectedPlant, hiddenFuels])

  return (
    <>
      <div ref={container} className="map" role="region" aria-label="Map" />
      {map &&
        (Object.entries(mixes) as [Area, RecordSlot][]).map(([area, record]) => (
          <AreaMarker key={area} map={map} area={area}>
            <MixGlyph
              name={lang === 'ja' ? AREA_BY_ID[area].ja : AREA_BY_ID[area].name}
              record={record}
              onPick={() => pick.current.onPick(area)}
            />
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

/** The basemap's place names in the language, falling back to the latin name and then whatever the tile has. */
function labelLanguage(map: MapLibre, lang: Lang): void {
  const named = map
    .getStyle()
    .layers.filter(
      (layer) => layer.type === 'symbol' && JSON.stringify(layer.layout?.['text-field'] ?? '').includes('name'),
    )
  for (const layer of named) {
    map.setLayoutProperty(layer.id, 'text-field', [
      'coalesce',
      ['get', `name:${lang}`],
      ['get', 'name:latin'],
      ['get', 'name'],
    ])
  }
}
