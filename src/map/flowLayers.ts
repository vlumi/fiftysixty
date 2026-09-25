import type { Layer } from '@deck.gl/core'
import { PathLayer, TextLayer } from '@deck.gl/layers'
import { load, type FlowSlot } from '../market/flows'
import { AREA_BY_ID } from '../regions/areas'
import { MIDDLE, OCCTO_LINE_IDS, type FlowEnd } from '../regions/interconnectors'
import type { Palette, Rgb, Rgba } from '../shared/palette'
import { BELOW_LABELS } from './basemap'
import type { Interleaved } from './layers'

/** A line for the slot, laid from where the power comes to where it goes. */
export interface FlowDatum {
  id: string
  label: string
  path: [[number, number], [number, number]]
  /** The flow, MW, always positive along `path`. */
  mw: number
  load: number
  split: boolean
}

const point = (end: FlowEnd): [number, number] => (end === 'middle' ? [...MIDDLE] : [...AREA_BY_ID[end].anchor])

export function flowData(flows: ReadonlyMap<string, FlowSlot>): FlowDatum[] {
  return OCCTO_LINE_IDS.flatMap((line) => {
    const at = flows.get(line.id)
    if (!at || at.flowMW === 0) return []
    const [from, to] = at.flowMW > 0 ? [line.from, line.to] : [line.to, line.from]
    return [
      {
        id: line.id,
        label: line.label,
        path: [point(from), point(to)],
        mw: Math.abs(at.flowMW),
        load: load(at),
        split: at.split,
      },
    ]
  })
}

const MW_PER_PX = 1000
const MIN_PX = 1
const RIM_PX = 4
/** How far along the line the shaft ends and the head begins. */
const HEAD_AT = 0.78

/** The line's width on screen, a pixel plus one per gigawatt. */
export const widthOf = (d: FlowDatum) => MIN_PX + d.mw / MW_PER_PX

/** The arrowhead's size on screen, growing with the shaft. */
export const headSize = (d: FlowDatum) => 8 + widthOf(d) * 3

/** The shaft, from the start to where the head begins. */
export function shaft([[x1, y1], [x2, y2]]: FlowDatum['path']): FlowDatum['path'] {
  return [
    [x1, y1],
    [x1 + (x2 - x1) * HEAD_AT, y1 + (y2 - y1) * HEAD_AT],
  ]
}

/** The arrow's heading in degrees counterclockwise from east, on the map's mercator plane. */
export function heading([[x1, y1], [x2, y2]]: FlowDatum['path']): number {
  const lat = ((y1 + y2) / 2) * (Math.PI / 180)
  return (Math.atan2((y2 - y1) / Math.cos(lat), x2 - x1) * 180) / Math.PI
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as Rgb

/**
 * The flows as arrows: a path with the width from the flow and the color from the load, a bright rim under it where
 * the market split, the shaft stopping where a head in the text color, sized with the shaft, points on the way the
 * power goes.
 */
export function buildFlowLayers(flows: ReadonlyMap<string, FlowSlot>, palette: Palette): Layer[] {
  const data = flowData(flows)
  if (!data.length) return []
  const color = (d: FlowDatum): Rgba => [...mix(palette.flow.idle, palette.flow.full, d.load), 230]
  const head = (d: FlowDatum): [number, number] => shaft(d.path)[1]
  return [
    new PathLayer<FlowDatum, Interleaved>({
      id: 'flow-splits',
      beforeId: BELOW_LABELS,
      data: data.filter((d) => d.split),
      getPath: (d) => shaft(d.path),
      getColor: [...palette.text, 200],
      getWidth: (d) => widthOf(d) + RIM_PX,
      widthUnits: 'pixels',
      capRounded: true,
      updateTriggers: { getColor: palette },
    }),
    new PathLayer<FlowDatum, Interleaved>({
      id: 'flows',
      beforeId: BELOW_LABELS,
      data,
      getPath: (d) => shaft(d.path),
      getColor: color,
      getWidth: widthOf,
      widthUnits: 'pixels',
      capRounded: true,
      pickable: true,
      updateTriggers: { getColor: palette },
    }),
    new TextLayer<FlowDatum, Interleaved>({
      id: 'flow-heads',
      beforeId: BELOW_LABELS,
      data,
      getPosition: head,
      getText: () => '▶',
      getAngle: (d) => heading(d.path),
      getColor: [...palette.text, 255],
      getSize: headSize,
      getTextAnchor: 'start',
      getAlignmentBaseline: 'center',
      sizeUnits: 'pixels',
      billboard: false,
      characterSet: ['▶'],
      fontFamily: 'sans-serif',
      updateTriggers: { getColor: palette },
    }),
  ]
}
