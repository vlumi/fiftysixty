import type { Layer } from '@deck.gl/core'
import { IconLayer, PathLayer } from '@deck.gl/layers'
import { load, type FlowSlot } from '../market/flows'
import { AREA_BY_ID, type Area } from '../regions/areas'
import { OCCTO_LINE_IDS } from '../regions/interconnectors'
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

const point = (end: Area): [number, number] => [...AREA_BY_ID[end].anchor]

export function flowData(flows: ReadonlyMap<string, FlowSlot>): FlowDatum[] {
  const lines = OCCTO_LINE_IDS.flatMap((line) => {
    const at = flows.get(line.id)
    if (!at || at.flowMW === 0 || line.from === 'middle' || line.to === 'middle') return []
    const [from, to] = at.flowMW > 0 ? [line.from, line.to] : [line.to, line.from]
    return [
      {
        id: line.id,
        label: line.label,
        path: [point(from as Area), point(to as Area)] as FlowDatum['path'],
        mw: Math.abs(at.flowMW),
        load: load(at),
        split: at.split,
      },
    ]
  })
  return [...lines, ...triangleFlows(flows)]
}

/** The triangle's areas, each with its fence and which way the fence's forward runs. */
const TRIANGLE: { area: Area; fence: string; forwardOut: boolean }[] = [
  { area: 'chubu', fence: 'chubu-fence', forwardOut: true },
  { area: 'hokuriku', fence: 'hokuriku-fence', forwardOut: false },
  { area: 'kansai', fence: 'kansai-fence', forwardOut: false },
]

/**
 * The flows between Chubu, Hokuriku and Kansai, resolved from OCCTO's three fences: what leaves an area across its
 * fence arrives across another's, so with one area taking in, each sender's outflow goes to it, and with one
 * sending, each receiver's inflow comes from it. A pair's load is the fuller of its two fences, its split either's.
 */
export function triangleFlows(flows: ReadonlyMap<string, FlowSlot>): FlowDatum[] {
  const sides = TRIANGLE.flatMap(({ area, fence, forwardOut }) => {
    const at = flows.get(fence)
    if (!at) return []
    return [{ area, out: forwardOut ? at.flowMW : -at.flowMW, load: load(at), split: at.split }]
  })
  if (sides.length < 3) return []
  const senders = sides.filter((s) => s.out > 0)
  const receivers = sides.filter((s) => s.out < 0)
  const pairs =
    receivers.length === 1
      ? senders.map((s) => ({ from: s, to: receivers[0], mw: s.out }))
      : senders.length === 1
        ? receivers.map((r) => ({ from: senders[0], to: r, mw: -r.out }))
        : []
  return pairs.map(({ from, to, mw }) => ({
    id: [from.area, to.area].sort().join('-'),
    label: `${AREA_BY_ID[from.area].name}–${AREA_BY_ID[to.area].name}`,
    path: [point(from.area), point(to.area)] as FlowDatum['path'],
    mw,
    load: Math.max(from.load, to.load),
    split: from.split || to.split,
  }))
}

const MW_PER_PX = 1000
const MIN_PX = 1
const RIM_PX = 4
/** How far along the line the shaft starts, clear of the column it leaves, and where it ends and the head begins. */
const SHAFT_FROM = 0.07
const HEAD_AT = 0.78
/** The shaft tapers from a hair at its start to its full width at the head, in this many steps. */
const TAPER_STEPS = 12

/** The line's width on screen, a pixel plus one per gigawatt. */
export const widthOf = (d: FlowDatum) => MIN_PX + d.mw / MW_PER_PX

/** The arrowhead's size on screen, growing with the shaft. */
export const headSize = (d: FlowDatum) => 8 + widthOf(d) * 3

/** A triangle pointing right, its base on the left edge, drawn white to be tinted. */
const HEAD_ICON = {
  head: {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><polygon points="0,4 64,32 0,60" fill="white"/></svg>',
    )}`,
    x: 0,
    y: 0,
    width: 64,
    height: 64,
    anchorX: 0,
    anchorY: 32,
    mask: true,
  },
}

const along = ([[x1, y1], [x2, y2]]: FlowDatum['path'], t: number): [number, number] => [
  x1 + (x2 - x1) * t,
  y1 + (y2 - y1) * t,
]

/** The shaft, from a little off the start to where the head begins. */
export function shaft(path: FlowDatum['path']): FlowDatum['path'] {
  return [along(path, SHAFT_FROM), along(path, HEAD_AT)]
}

/** A piece of a tapering shaft: its own path and its width, a fraction of the whole shaft's. */
export interface Taper {
  flow: FlowDatum
  path: FlowDatum['path']
  width: number
}

/** The shaft cut into pieces of growing width, thin where the power leaves and full where the head begins. */
export function tapered(d: FlowDatum, extra = 0): Taper[] {
  const full = widthOf(d)
  return Array.from({ length: TAPER_STEPS }, (_, i) => {
    const from = SHAFT_FROM + ((HEAD_AT - SHAFT_FROM) * i) / TAPER_STEPS
    const to = SHAFT_FROM + ((HEAD_AT - SHAFT_FROM) * (i + 1)) / TAPER_STEPS
    return {
      flow: d,
      path: [along(d.path, from), along(d.path, to)],
      width: MIN_PX + ((full - MIN_PX) * (i + 1)) / TAPER_STEPS + extra,
    }
  })
}

/** The arrow's heading in degrees counterclockwise from east, on the map's mercator plane. */
export function heading([[x1, y1], [x2, y2]]: FlowDatum['path']): number {
  const lat = ((y1 + y2) / 2) * (Math.PI / 180)
  return (Math.atan2((y2 - y1) / Math.cos(lat), x2 - x1) * 180) / Math.PI
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as Rgb

/**
 * The flows as arrows: a shaft tapering from a hair where the power leaves to the flow's width where the head begins,
 * colored by the load, with a bright rim under it where the market split, and a head in the same color, sized with
 * the shaft, pointing on the way the power goes.
 */
export function buildFlowLayers(flows: ReadonlyMap<string, FlowSlot>, palette: Palette): Layer[] {
  const data = flowData(flows)
  if (!data.length) return []
  const color = (d: FlowDatum): Rgba => [...mix(palette.flow.idle, palette.flow.full, d.load), 230]
  const head = (d: FlowDatum): [number, number] => shaft(d.path)[1]
  return [
    new PathLayer<Taper, Interleaved>({
      id: 'flow-splits',
      beforeId: BELOW_LABELS,
      data: data.filter((d) => d.split).flatMap((d) => tapered(d, RIM_PX)),
      getPath: (t) => t.path,
      getColor: [...palette.text, 200],
      getWidth: (t) => t.width,
      widthUnits: 'pixels',
      capRounded: true,
      updateTriggers: { getColor: palette },
    }),
    new PathLayer<Taper, Interleaved>({
      id: 'flows',
      beforeId: BELOW_LABELS,
      data: data.flatMap((d) => tapered(d)),
      getPath: (t) => t.path,
      getColor: (t) => color(t.flow),
      getWidth: (t) => t.width,
      widthUnits: 'pixels',
      capRounded: true,
      pickable: true,
      updateTriggers: { getColor: palette },
    }),
    new IconLayer<FlowDatum, Interleaved>({
      id: 'flow-heads',
      beforeId: BELOW_LABELS,
      data,
      iconAtlas: HEAD_ICON.head.url,
      iconMapping: HEAD_ICON,
      getIcon: () => 'head',
      getPosition: head,
      getAngle: (d) => heading(d.path),
      getColor: color,
      getSize: headSize,
      sizeUnits: 'pixels',
      billboard: false,
      updateTriggers: { getColor: palette },
    }),
  ]
}
