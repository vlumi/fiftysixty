import { render } from '@testing-library/react'
import type { Regions } from '../regions/geometry'
import MapView from './MapView'

const { mapInstance, overlayInstance } = vi.hoisted(() => ({
  mapInstance: { addControl: vi.fn(), remove: vi.fn() },
  overlayInstance: { setProps: vi.fn() },
}))

vi.mock('maplibre-gl', () => ({
  Map: vi.fn(function () {
    return mapInstance
  }),
  NavigationControl: vi.fn(),
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
  const { rerender, unmount } = render(<MapView regions={null} onPick={vi.fn()} />)
  expect(mapInstance.addControl).toHaveBeenCalledWith(overlayInstance)
  expect(overlayInstance.setProps).toHaveBeenLastCalledWith({ layers: [] })
  rerender(<MapView regions={regions} onPick={vi.fn()} />)
  const { layers } = overlayInstance.setProps.mock.lastCall![0]
  expect(layers.map((l: { id: string }) => l.id)).toEqual(['areas', 'split'])
  unmount()
  expect(mapInstance.remove).toHaveBeenCalled()
})

test('a click reports the area under it, or none for the sea', () => {
  const onPick = vi.fn()
  render(<MapView regions={regions} onPick={onPick} />)
  const onClick = MapLibreOverlay.mock.lastCall![0].onClick!
  onClick({ object: { properties: { area: 'kyushu', hz: 60 } } })
  expect(onPick).toHaveBeenLastCalledWith('kyushu')
  onClick({ object: undefined })
  expect(onPick).toHaveBeenLastCalledWith(null)
})
