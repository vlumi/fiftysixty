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
vi.mock('@deck.gl/maplibre', () => ({
  MapLibreOverlay: vi.fn(function () {
    return overlayInstance
  }),
}))

const regions: Regions = {
  areas: { type: 'FeatureCollection', features: [] },
  split: { type: 'FeatureCollection', features: [] },
}

test('the overlay joins the map, gets the layers once the regions arrive, and goes with the map', () => {
  const { rerender, unmount } = render(<MapView regions={null} />)
  expect(mapInstance.addControl).toHaveBeenCalledWith(overlayInstance)
  expect(overlayInstance.setProps).toHaveBeenLastCalledWith({ layers: [] })
  rerender(<MapView regions={regions} />)
  const { layers } = overlayInstance.setProps.mock.lastCall![0]
  expect(layers.map((l: { id: string }) => l.id)).toEqual(['areas', 'split'])
  unmount()
  expect(mapInstance.remove).toHaveBeenCalled()
})
