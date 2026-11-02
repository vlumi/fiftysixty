import type { Regions } from '../regions/geometry'
import areasJson from '../../public/geo/areas.geojson?raw'
import splitJson from '../../public/geo/split.geojson?raw'
import { halfOutline, type Segment } from './outline'

const areas = JSON.parse(areasJson) as Regions['areas']
const split = JSON.parse(splitJson) as Regions['split']

const keyOf = ([a, b]: Segment) => [a.join(','), b.join(',')].sort().join('|')

test('two squares side by side outline as one oblong: the edge they share is left out', () => {
  const square = (x: number): Regions['areas']['features'][number] => ({
    type: 'Feature',
    properties: { area: x ? 'tokyo' : 'tohoku', hz: 50 },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [x, 0],
          [x + 1, 0],
          [x + 1, 1],
          [x, 1],
          [x, 0],
        ],
      ],
    },
  })
  const outline = halfOutline({ type: 'FeatureCollection', features: [square(0), square(1)] }, 50)
  expect(outline).toHaveLength(6)
  expect(outline.map(keyOf)).not.toContain('1,0|1,1')
  expect(halfOutline({ type: 'FeatureCollection', features: [square(0), square(1)] }, 60)).toEqual([])
})

test("on the real areas each half's outline is its coast and the split line, the borders inside it left out", () => {
  const fifty = halfOutline(areas, 50).map(keyOf)
  const sixty = halfOutline(areas, 60).map(keyOf)
  expect(fifty).toHaveLength(952)
  expect(sixty).toHaveLength(1517)
  const [line] = split.features
  const splitEdges = line.geometry.coordinates
    .slice(1)
    .map((p, i) => keyOf([line.geometry.coordinates[i], p] as Segment))
  for (const edge of splitEdges) {
    expect(fifty).toContain(edge)
    expect(sixty).toContain(edge)
  }
  expect(new Set(fifty).size).toBe(fifty.length)
})
