import type { IconLayer, PathLayer } from '@deck.gl/layers'
import csv from '../test/fixtures/occto-renkei.csv?raw'
import { flowsAt, parseFlows } from '../market/flows'
import { AREA_BY_ID } from '../regions/areas'
import { DARK } from '../shared/palette'
import {
  buildFlowLayers,
  flowData,
  headSize,
  heading,
  shaft,
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

test('the arrow heads along the path, the layers take width from the flow and color from the load, and split lines get a rim', () => {
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
  const [rims, paths, heads] = buildFlowLayers(noon, DARK) as [
    PathLayer<FlowDatum>,
    PathLayer<FlowDatum>,
    IconLayer<FlowDatum>,
  ]
  expect([rims.id, paths.id, heads.id]).toEqual(['flow-splits', 'flows', 'flow-heads'])
  const kc = flowData(noon).find((d) => d.id === 'kansai-chugoku')!
  expect(widthOf(kc)).toBeCloseTo(1 + 6.58)
  const color = paths.props.getColor
  if (typeof color !== 'function') throw new Error('accessor')
  expect(color(kc, { index: 0, data: [], target: [] })).toEqual([...DARK.flow.full, 230])
  expect((rims.props.data as FlowDatum[]).map((d) => d.id)).toEqual(
    flowData(noon)
      .filter((d) => d.split)
      .map((d) => d.id),
  )
  expect((rims.props.data as FlowDatum[]).length).toBeGreaterThan(0)
  const path = paths.props.getPath
  if (typeof path !== 'function') throw new Error('accessor')
  const end = shaft(kc.path)[1]
  expect(path(kc, { index: 0, data: [], target: [] })).toEqual([kc.path[0], end])
  expect(end[0]).toBeCloseTo(kc.path[0][0] + (kc.path[1][0] - kc.path[0][0]) * 0.78)
  const position = heads.props.getPosition
  if (typeof position !== 'function') throw new Error('accessor')
  expect(position(kc, { index: 0, data: [], target: [] })).toEqual(end)
  expect(headSize(kc)).toBeCloseTo(8 + (1 + 6.58) * 3)
  const headColor = heads.props.getColor
  if (typeof headColor !== 'function') throw new Error('accessor')
  expect(headColor(kc, { index: 0, data: [], target: [] })).toEqual(color(kc, { index: 0, data: [], target: [] }))
})

test('no flows, no layers', () => {
  expect(buildFlowLayers(new Map(), DARK)).toEqual([])
})
