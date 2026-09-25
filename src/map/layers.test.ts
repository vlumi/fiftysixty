import type { GeoJsonLayer } from '@deck.gl/layers'
import type { AreaProps, Regions } from '../regions/geometry'
import { DARK } from '../shared/palette'
import { priceColor } from '../shared/scale'
import { buildLayers, type AreaPrices, type Interleaved } from './layers'

const regions: Regions = {
  areas: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { area: 'tokyo', hz: 50 }, geometry: { type: 'Polygon', coordinates: [] } },
      { type: 'Feature', properties: { area: 'kansai', hz: 60 }, geometry: { type: 'Polygon', coordinates: [] } },
      { type: 'Feature', properties: { area: 'okinawa', hz: 60 }, geometry: { type: 'Polygon', coordinates: [] } },
    ],
  },
  split: { type: 'FeatureCollection', features: [] },
}

test('nothing is drawn before the regions arrive', () => {
  expect(buildLayers(null, DARK)).toEqual([])
})

test('the areas are filled by their frequency and the split line drawn in the accent, under the labels', () => {
  const [areas, split] = buildLayers(regions, DARK) as GeoJsonLayer<AreaProps, Interleaved>[]
  expect([areas.id, split.id]).toEqual(['areas', 'split'])
  const fill = areas.props.getFillColor
  if (typeof fill !== 'function') throw new Error('the fill is an accessor')
  const context = { index: 0, data: regions.areas.features, target: [] }
  expect(fill(regions.areas.features[0], context)).toEqual([...DARK.hz[50], 45])
  expect(fill(regions.areas.features[1], context)).toEqual([...DARK.hz[60], 45])
  expect(split.props.getLineColor).toEqual([...DARK.accent, 255])
  expect(areas.props.beforeId).toBe('water_name')
  expect(split.props.beforeId).toBe('water_name')
})

test('with prices the areas take the price scale and Okinawa, which has none, is muted', () => {
  const prices = { tokyo: 30, kansai: 5 } as AreaPrices
  const [areas] = buildLayers(regions, DARK, { prices }) as GeoJsonLayer<AreaProps, Interleaved>[]
  const fill = areas.props.getFillColor
  if (typeof fill !== 'function') throw new Error('the fill is an accessor')
  const context = { index: 0, data: regions.areas.features, target: [] }
  expect(fill(regions.areas.features[0], context)).toEqual([...priceColor(30, DARK.price), 170])
  expect(fill(regions.areas.features[1], context)).toEqual([...priceColor(5, DARK.price), 170])
  expect(fill(regions.areas.features[2], context)).toEqual([...DARK.muted, 40])
})

test('the selected area is outlined strongly', () => {
  const [areas] = buildLayers(regions, DARK, { selected: 'kansai' }) as GeoJsonLayer<AreaProps, Interleaved>[]
  const width = areas.props.getLineWidth
  if (typeof width !== 'function') throw new Error('the width is an accessor')
  const context = { index: 0, data: regions.areas.features, target: [] }
  expect(width(regions.areas.features[0], context)).toBe(1)
  expect(width(regions.areas.features[1], context)).toBe(2.5)
})
