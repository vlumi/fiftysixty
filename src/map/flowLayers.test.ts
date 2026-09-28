import type { IconLayer, SolidPolygonLayer } from '@deck.gl/layers'
import csv from '../test/fixtures/occto-renkei.csv?raw'
import { flowsAt, parseFlows } from '../market/flows'
import { forkOf, planned } from '../market/interchange'
import { AREA_BY_ID } from '../regions/areas'
import { DARK } from '../shared/palette'
import {
  buildFlowLayers,
  degreesPerPixel,
  flowData,
  forkData,
  headSize,
  heading,
  shaftEnds,
  taperPolygon,
  widthOf,
  type FlowDatum,
} from './flowLayers'

const noon = planned(flowsAt(parseFlows(csv), '2026-09-23', 24))

test('a line is laid from where the power comes: Kansai–Chugoku from Chugoku, Kitahon from Hokkaido', () => {
  const data = flowData(noon)
  const kc = data.find((d) => d.id === 'kansai-chugoku')!
  expect(kc.path).toEqual([AREA_BY_ID.chugoku.anchor, AREA_BY_ID.kansai.anchor])
  expect(kc.mw).toBe(3290)
  expect(kc.load).toBe(1)
  const kitahon = data.find((d) => d.id === 'kitahon')!
  expect(kitahon.path).toEqual([AREA_BY_ID.hokkaido.anchor, AREA_BY_ID.tohoku.anchor])
  expect(data.map((d) => d.id)).not.toContain('chubu-fence')
  expect(data).toHaveLength(7 + 3)
})

test("the plan's Chubu, Hokuriku and Kansai loop is a fork into Chubu: two thin tails meeting, then one arrow", () => {
  const data = flowData(noon)
  const fork = data.filter((d) => d.id.startsWith('chubu-hokuriku-kansai'))
  expect(fork.map((d) => [d.id, d.head, d.px ?? null, d.mw])).toEqual([
    ['chubu-hokuriku-kansai/0', false, 2, 0],
    ['chubu-hokuriku-kansai/1', false, 2, 0],
    ['chubu-hokuriku-kansai', true, null, 1830],
  ])
  const [, , shaft] = fork
  expect(shaft.path[1]).toEqual(AREA_BY_ID.chubu.anchor)
  expect(shaft.clear).toEqual([false, true])
})

test('a fork out of an area runs one arrow to the junction and a headed tail to each of the other two', () => {
  const out = forkOf('x', { hokuriku: -500, chubu: 200, kansai: 300 })!
  const [a, b, shaft] = forkData(out)
  expect(shaft).toMatchObject({ head: false, clear: [true, false], mw: 500 })
  expect(shaft.path[0]).toEqual(AREA_BY_ID.hokuriku.anchor)
  expect([a, b].map((t) => [t.head, t.clear, t.path[1]])).toEqual([
    [true, [false, true], AREA_BY_ID.chubu.anchor],
    [true, [false, true], AREA_BY_ID.kansai.anchor],
  ])
  expect(widthOf(a)).toBe(2)
  expect(taperPolygon(a, 5)[0]).not.toEqual(taperPolygon(a, 5)[3])
})

test('the shaft is one solid shape, a hair wide off the column and the flow width at the head, in degrees for the zoom', () => {
  const east: FlowDatum = {
    id: 'x',
    path: [
      [130, 35],
      [140, 35],
    ],
    mw: 3000,
    load: 0.5,
    head: true,
    clear: [true, true],
  }
  const zoom = 5
  const [a, b, c, d] = taperPolygon(east, zoom)
  const [from, to] = shaftEnds(east, zoom)
  expect(a[0]).toBeCloseTo(from[0])
  expect(b[0]).toBeCloseTo(to[0])
  const perLatPixel = degreesPerPixel(zoom) * Math.cos((35 * Math.PI) / 180)
  expect(Math.abs(a[1] - d[1]) / perLatPixel).toBeCloseTo(1)
  expect(Math.abs(b[1] - c[1]) / perLatPixel).toBeCloseTo(widthOf(east))
  // A level in, the pixels are half the degrees and the shaft has grown by half, so three quarters in degrees.
  expect(Math.abs(taperPolygon(east, zoom + 1)[1][1] - taperPolygon(east, zoom + 1)[2][1])).toBeCloseTo(
    Math.abs(b[1] - c[1]) * 0.75,
  )
  // A level out, the shaft is half the pixels.
  expect(widthOf(east, zoom - 1)).toBeCloseTo(widthOf(east) / 2)
})

test('the arrow heads along the path, the shapes take color from the load, the head sits at the shaft end in the same color', () => {
  expect(
    heading([
      [130, 35],
      [140, 35],
    ]),
  ).toBeCloseTo(0)
  expect(
    heading([
      [135, 30],
      [135, 40],
    ]),
  ).toBeCloseTo(90)
  const [shafts, heads] = buildFlowLayers(noon, DARK, 5) as [SolidPolygonLayer<FlowDatum>, IconLayer<FlowDatum>]
  expect([shafts.id, heads.id]).toEqual(['flows', 'flow-heads'])
  const kc = flowData(noon).find((d) => d.id === 'kansai-chugoku')!
  expect(widthOf(kc)).toBeCloseTo(1 + 3.29)
  const context = { index: 0, data: [], target: [] }
  const color = shafts.props.getFillColor
  if (typeof color !== 'function') throw new Error('accessor')
  expect(color(kc, context)).toEqual([...DARK.flow.planned.full, 230])
  const position = heads.props.getPosition
  if (typeof position !== 'function') throw new Error('accessor')
  expect(position(kc, context)).toEqual(shaftEnds(kc, 5)[1])
  expect(headSize(kc)).toBeCloseTo(8 + (1 + 3.29) * 3)
  expect(headSize(kc, 4)).toBeCloseTo((8 + (1 + 3.29) * 3) / 2)
  const headColor = heads.props.getColor
  if (typeof headColor !== 'function') throw new Error('accessor')
  expect(headColor(kc, context)).toEqual([...DARK.flow.planned.full, 230])
})

test('the shaft starts and the head ends clear of the columns by pixels, so a phone tucks no head under a column', () => {
  const line = (path: FlowDatum['path'], mw = 1000): FlowDatum => ({
    id: 'x',
    path,
    mw,
    load: 0.5,
    head: true,
    clear: [true, true],
  })
  const east = line([
    [130, 35],
    [140, 35],
  ])
  const perLonPixel = degreesPerPixel(5)
  const [from, to] = shaftEnds(east, 5)
  expect((from[0] - 130) / perLonPixel).toBeCloseTo(12)
  expect((140 - to[0]) / perLonPixel).toBeCloseTo(12 + headSize(east))
  const north = line([
    [135, 30],
    [135, 40],
  ])
  const perLatPixel = perLonPixel * Math.cos((35 * Math.PI) / 180)
  expect((shaftEnds(north, 5)[0][1] - 30) / perLatPixel).toBeCloseTo(48)
  // Zoomed out, the line and the column are half the pixels, so the pixels clear and the shaft halve with them.
  const [farFrom, farTo] = shaftEnds(east, 4)
  expect((farFrom[0] - 130) / degreesPerPixel(4)).toBeCloseTo(6)
  expect((farTo[0] - farFrom[0]) / degreesPerPixel(4)).toBeCloseTo((to[0] - from[0]) / degreesPerPixel(5) / 2)
  // A short line keeps two fifths of itself as the shaft, the clearances and the head sharing the rest.
  const short = line([
    [135, 35],
    [135.5, 35],
  ])
  const [nearFrom, nearTo] = shaftEnds(short, 4)
  expect((nearTo[0] - nearFrom[0]) / 0.5).toBeCloseTo(0.4)
})

test('no flows, no layers', () => {
  expect(buildFlowLayers(null, DARK, 5)).toEqual([])
  expect(buildFlowLayers({ source: 'planned', links: [], forks: [] }, DARK, 5)).toEqual([])
})
