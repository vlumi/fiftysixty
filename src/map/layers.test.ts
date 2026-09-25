import type { GeoJsonLayer } from '@deck.gl/layers'
import type { AreaProps, Regions } from '../regions/geometry'
import { DARK } from '../shared/palette'
import { buildLayers, type Interleaved } from './layers'

const regions: Regions = {
  areas: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { area: 'tokyo', hz: 50 }, geometry: { type: 'Polygon', coordinates: [] } },
      { type: 'Feature', properties: { area: 'kansai', hz: 60 }, geometry: { type: 'Polygon', coordinates: [] } },
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
