import type { PathLayer, TextLayer } from '@deck.gl/layers'
import csv from '../test/fixtures/occto-renkei.csv?raw'
import { flowsAt, parseFlows } from '../market/flows'
import { AREA_BY_ID } from '../regions/areas'
import { MIDDLE } from '../regions/interconnectors'
import { DARK } from '../shared/palette'
import { buildFlowLayers, flowData, headSize, heading, shaft, widthOf, type FlowDatum } from './flowLayers'

const noon = flowsAt(parseFlows(csv), '2026-09-23', 24)

test('a line is laid from where the power comes: Kansai–Chugoku from Chugoku, the Chubu fence from the middle', () => {
  const data = flowData(noon)
  const kc = data.find((d) => d.id === 'kansai-chugoku')!
  expect(kc.path).toEqual([AREA_BY_ID.chugoku.anchor, AREA_BY_ID.kansai.anchor])
  expect(kc.mw).toBe(6580)
  expect(kc.load).toBe(1)
  expect(kc.split).toBe(true)
  const chubu = data.find((d) => d.id === 'chubu-fence')!
  expect(chubu.path).toEqual([MIDDLE, AREA_BY_ID.chubu.anchor])
  const kitahon = data.find((d) => d.id === 'kitahon')!
  expect(kitahon.path).toEqual([AREA_BY_ID.hokkaido.anchor, AREA_BY_ID.tohoku.anchor])
  expect(data).toHaveLength(10)
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
    TextLayer<FlowDatum>,
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
})

test('no flows, no layers', () => {
  expect(buildFlowLayers(new Map(), DARK)).toEqual([])
})
