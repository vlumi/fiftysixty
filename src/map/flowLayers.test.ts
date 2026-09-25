import type { IconLayer, SolidPolygonLayer } from '@deck.gl/layers'
import csv from '../test/fixtures/occto-renkei.csv?raw'
import { flowsAt, parseFlows } from '../market/flows'
import { AREA_BY_ID } from '../regions/areas'
import { DARK } from '../shared/palette'
import {
  buildFlowLayers,
  degreesPerPixel,
  flowData,
  headSize,
  heading,
  shaft,
  taperPolygon,
  triangleFlows,
  widthOf,
  type FlowDatum,
} from './flowLayers'

const noon = flowsAt(parseFlows(csv), '2026-09-23', 24)

test('a line is laid from where the power comes: Kansai–Chugoku from Chugoku, Kitahon from Hokkaido', () => {
  const data = flowData(noon)
  const kc = data.find((d) => d.id === 'kansai-chugoku')!
  expect(kc.path).toEqual([AREA_BY_ID.chugoku.anchor, AREA_BY_ID.kansai.anchor])
  expect(kc.mw).toBe(6580)
  expect(kc.load).toBe(1)
  expect(kc.split).toBe(true)
  const kitahon = data.find((d) => d.id === 'kitahon')!
  expect(kitahon.path).toEqual([AREA_BY_ID.hokkaido.anchor, AREA_BY_ID.tohoku.anchor])
  expect(data.map((d) => d.id)).not.toContain('chubu-fence')
  expect(data).toHaveLength(7 + 2)
})

test('the fences resolve into flows between the neighbors: at that noon Kansai and Hokuriku both feed Chubu', () => {
  const pairs = triangleFlows(noon)
  expect(pairs.map((p) => [p.id, p.mw, p.path])).toEqual([
    ['chubu-hokuriku', 539, [AREA_BY_ID.hokuriku.anchor, AREA_BY_ID.chubu.anchor]],
    ['chubu-kansai', 1290, [AREA_BY_ID.kansai.anchor, AREA_BY_ID.chubu.anchor]],
  ])
  expect(pairs[1].split).toBe(true)
  expect(pairs[1].load).toBe(1)
  expect(pairs[1].label).toBe('Kansai–Chubu')
})

test('with one sender and two receivers the flows fan out from it, and with a fence missing none are drawn', () => {
  const fence = (flowMW: number) => ({
    slot: 1,
    capacityMW: { forward: 2000, reverse: 2000 },
    flowMW,
    freeMW: { forward: 0, reverse: 0 },
    split: false,
  })
  const spreading = new Map([
    ['chubu-fence', fence(1000)],
    ['hokuriku-fence', fence(300)],
    ['kansai-fence', fence(700)],
  ])
  expect(triangleFlows(spreading).map((p) => [p.id, p.mw])).toEqual([
    ['chubu-hokuriku', 300],
    ['chubu-kansai', 700],
  ])
  expect(triangleFlows(new Map([['chubu-fence', fence(1000)]]))).toEqual([])
})

test('the shaft is one solid shape, a hair wide off the column and the flow width at the head, in degrees for the zoom', () => {
  const east: FlowDatum = {
    id: 'x',
    label: 'x',
    path: [
      [130, 35],
      [140, 35],
    ],
    mw: 3000,
    load: 0.5,
    split: false,
  }
  const zoom = 5
  const [a, b, c, d] = taperPolygon(east, zoom)
  const [from, to] = shaft(east.path)
  expect(a[0]).toBeCloseTo(from[0])
  expect(b[0]).toBeCloseTo(to[0])
  const perLatPixel = degreesPerPixel(zoom) * Math.cos((35 * Math.PI) / 180)
  expect(Math.abs(a[1] - d[1]) / perLatPixel).toBeCloseTo(1)
  expect(Math.abs(b[1] - c[1]) / perLatPixel).toBeCloseTo(widthOf(east))
  expect(Math.abs(taperPolygon(east, zoom, 4)[1][1] - taperPolygon(east, zoom, 4)[2][1]) / perLatPixel).toBeCloseTo(
    widthOf(east) + 4,
  )
  expect(Math.abs(taperPolygon(east, zoom + 1)[1][1] - taperPolygon(east, zoom + 1)[2][1])).toBeCloseTo(
    Math.abs(b[1] - c[1]) / 2,
  )
})

test('the arrow heads along the path, the shapes take color from the load, split lines get a rim, the head sits at the shaft end in the same color', () => {
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
  const [rims, shafts, heads] = buildFlowLayers(noon, DARK, 5) as [
    SolidPolygonLayer<FlowDatum>,
    SolidPolygonLayer<FlowDatum>,
    IconLayer<FlowDatum>,
  ]
  expect([rims.id, shafts.id, heads.id]).toEqual(['flow-splits', 'flows', 'flow-heads'])
  const kc = flowData(noon).find((d) => d.id === 'kansai-chugoku')!
  expect(widthOf(kc)).toBeCloseTo(1 + 6.58)
  const context = { index: 0, data: [], target: [] }
  const color = shafts.props.getFillColor
  if (typeof color !== 'function') throw new Error('accessor')
  expect(color(kc, context)).toEqual([...DARK.flow.full, 230])
  expect((rims.props.data as FlowDatum[]).map((d) => d.id)).toEqual(
    flowData(noon)
      .filter((d) => d.split)
      .map((d) => d.id),
  )
  expect((rims.props.data as FlowDatum[]).length).toBeGreaterThan(0)
  const position = heads.props.getPosition
  if (typeof position !== 'function') throw new Error('accessor')
  expect(position(kc, context)).toEqual(shaft(kc.path)[1])
  expect(headSize(kc)).toBeCloseTo(8 + (1 + 6.58) * 3)
  const headColor = heads.props.getColor
  if (typeof headColor !== 'function') throw new Error('accessor')
  expect(headColor(kc, context)).toEqual([...DARK.flow.full, 230])
})

test('no flows, no layers', () => {
  expect(buildFlowLayers(new Map(), DARK, 5)).toEqual([])
})
