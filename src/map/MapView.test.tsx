import { render } from '@testing-library/react'
import csv from '../test/fixtures/tepco-jukyu.csv?raw'
import { recordSlot } from '../market/record'
import { TEPCO } from '../market/tepco'
import type { Regions } from '../regions/geometry'
import MapView from './MapView'

const { mapInstance, overlayInstance, markers } = vi.hoisted(() => ({
  mapInstance: {
    addControl: vi.fn(),
    remove: vi.fn(),
    on: vi.fn(),
    getZoom: () => 5,
    setStyle: vi.fn(),
    isStyleLoaded: () => true,
    getStyle: () => ({ layers: [{ id: 'place', type: 'symbol', layout: { 'text-field': '{name:latin}' } }] }),
    setLayoutProperty: vi.fn(),
  },
  overlayInstance: { setProps: vi.fn() },
  markers: [] as { lngLat: unknown; element: HTMLElement; remove: () => void }[],
}))

vi.mock('maplibre-gl', () => ({
  Map: vi.fn(function () {
    return mapInstance
  }),
  NavigationControl: vi.fn(),
  Marker: vi.fn(function (this: unknown, { element }: { element: HTMLElement }) {
    const marker = { element, lngLat: null as unknown, remove: vi.fn() }
    markers.push(marker)
    return {
      setLngLat(lngLat: unknown) {
        marker.lngLat = lngLat
        return this
      },
      addTo() {
        return this
      },
      remove: marker.remove,
    }
  }),
  setWorkerUrl: vi.fn(),
}))
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({ default: '/worker.js' }))
interface OverlayProps {
  onClick?: (info: { object?: unknown }) => void
}
const MapLibreOverlay = vi.hoisted(() =>
  vi.fn(function (_props: OverlayProps) {
    return overlayInstance
  }),
)
vi.mock('@deck.gl/maplibre', () => ({ MapLibreOverlay }))

const regions: Regions = {
  areas: { type: 'FeatureCollection', features: [] },
  split: { type: 'FeatureCollection', features: [] },
}

test('the overlay joins the map, gets the layers once the regions arrive, and goes with the map', () => {
  const { rerender, unmount } = render(
    <MapView theme="dark" lang="en" regions={null} onPick={vi.fn()} onPickPlant={vi.fn()} />,
  )
  expect(mapInstance.addControl).toHaveBeenCalledWith(overlayInstance)
  expect(overlayInstance.setProps).toHaveBeenLastCalledWith({ layers: [] })
  rerender(<MapView theme="dark" lang="en" regions={regions} onPick={vi.fn()} onPickPlant={vi.fn()} />)
  const { layers } = overlayInstance.setProps.mock.lastCall![0]
  expect(layers.map((l: { id: string }) => l.id)).toEqual(['areas', 'split'])
  unmount()
  expect(mapInstance.remove).toHaveBeenCalled()
})

test('a click reports the area under it, or none for the sea', () => {
  const onPick = vi.fn()
  render(<MapView theme="dark" lang="en" regions={regions} onPick={onPick} onPickPlant={vi.fn()} />)
  const onClick = MapLibreOverlay.mock.lastCall![0].onClick!
  onClick({ object: { properties: { area: 'kyushu', hz: 60 } } })
  expect(onPick).toHaveBeenLastCalledWith('kyushu')
  onClick({ object: undefined })
  expect(onPick).toHaveBeenLastCalledWith(null)
  onClick({ object: { id: 'kitahon', path: [] } })
  expect(onPick).toHaveBeenLastCalledWith(null)
})

test('a click on a plant reports the plant, and the zoom is reported as it changes', () => {
  const onPickPlant = vi.fn()
  const onZoom = vi.fn()
  render(
    <MapView theme="dark" lang="en" regions={regions} onPick={vi.fn()} onPickPlant={onPickPlant} onZoom={onZoom} />,
  )
  const onClick = MapLibreOverlay.mock.lastCall![0].onClick!
  onClick({ object: { properties: { id: 'way/1', name: 'x', fuel: 'coal', mw: 100 } } })
  expect(onPickPlant).toHaveBeenCalledWith('way/1')
  expect(onZoom).toHaveBeenCalledWith(5)
  onZoom.mockClear()
  const zoomed = mapInstance.on.mock.calls.find((c) => c[0] === 'zoom')![1] as () => void
  zoomed()
  expect(onZoom).toHaveBeenCalledWith(5)
})

test('a recorded area gets a glyph on its anchor, which picks the area, and loses it when the record goes', () => {
  const onPick = vi.fn()
  const record = recordSlot(TEPCO.parse(csv), '2026-09-24', 25)!
  const { rerender } = render(
    <MapView
      theme="dark"
      lang="en"
      regions={regions}
      mixes={{ tokyo: record }}
      onPick={onPick}
      onPickPlant={vi.fn()}
    />,
  )
  expect(markers).toHaveLength(1)
  expect(markers[0].lngLat).toEqual([139.6, 36.1])
  const glyph = markers[0].element.querySelector('button')!
  expect(glyph).toHaveAccessibleName('Tokyo mix')
  glyph.click()
  expect(onPick).toHaveBeenCalledWith('tokyo')
  rerender(<MapView theme="dark" lang="en" regions={regions} mixes={{}} onPick={onPick} onPickPlant={vi.fn()} />)
  expect(markers[0].remove).toHaveBeenCalled()
})

test('a theme change swaps the basemap and recolors the layers', () => {
  const { rerender } = render(
    <MapView theme="dark" lang="en" regions={regions} onPick={vi.fn()} onPickPlant={vi.fn()} />,
  )
  expect(mapInstance.setStyle).not.toHaveBeenCalled()
  rerender(<MapView theme="light" lang="en" regions={regions} onPick={vi.fn()} onPickPlant={vi.fn()} />)
  expect(mapInstance.setStyle).toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/positron')
  const { layers } = overlayInstance.setProps.mock.lastCall![0]
  expect(layers[0].props.beforeId).toBe('waterway_line_label')
})

test('the basemap labels follow the language', () => {
  const { rerender } = render(
    <MapView theme="dark" lang="en" regions={regions} onPick={vi.fn()} onPickPlant={vi.fn()} />,
  )
  rerender(<MapView theme="dark" lang="ja" regions={regions} onPick={vi.fn()} onPickPlant={vi.fn()} />)
  expect(mapInstance.setLayoutProperty).toHaveBeenLastCalledWith('place', 'text-field', [
    'coalesce',
    ['get', 'name:ja'],
    ['get', 'name:latin'],
    ['get', 'name'],
  ])
})
