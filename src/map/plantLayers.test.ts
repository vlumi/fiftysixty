import type { ScatterplotLayer } from '@deck.gl/layers'
import type { Feature, Point } from 'geojson'
import fixture from '../test/fixtures/plants.geojson?raw'
import type { PlantProps, Plants } from '../regions/plants'
import { DARK } from '../shared/palette'
import { buildPlantLayers, plantRadius } from './plantLayers'

const plants = JSON.parse(fixture) as Plants

test('the plants are colored by fuel, sized by the root of the capacity and shrunk when far out, the picked one outlined', () => {
  expect(buildPlantLayers(null, DARK, 8, null)).toEqual([])
  const [layer] = buildPlantLayers(plants, DARK, 8, plants.features[1].properties.id) as [
    ScatterplotLayer<Feature<Point, PlantProps>>,
  ]
  expect(layer.id).toBe('plants')
  const context = { index: 0, data: plants.features, target: [] }
  const fill = layer.props.getFillColor
  const radius = layer.props.getRadius
  const line = layer.props.getLineWidth
  if (typeof fill !== 'function' || typeof radius !== 'function' || typeof line !== 'function')
    throw new Error('accessor')
  expect(fill(plants.features[0], context)).toEqual([...DARK.series.coal, 220])
  expect(radius(plants.features[1], context)).toBeCloseTo(plantRadius(8212))
  expect(plantRadius(100)).toBeCloseTo(5.5)
  expect(plantRadius(100, 8)).toBeCloseTo(5.5)
  expect(plantRadius(100, 5)).toBeCloseTo(2.75)
  expect(plantRadius(10, 3)).toBe(1.5)
  expect(line(plants.features[1], context)).toBe(2)
  expect(line(plants.features[0], context)).toBe(1)
})

test('hidden fuels leave the map', () => {
  const [layer] = buildPlantLayers(plants, DARK, 8, null, ['coal', 'hydro']) as [
    ScatterplotLayer<Feature<Point, PlantProps>>,
  ]
  expect((layer.props.data as Feature<Point, PlantProps>[]).map((f) => f.properties.fuel)).toEqual(['nuclear', 'solar'])
})
