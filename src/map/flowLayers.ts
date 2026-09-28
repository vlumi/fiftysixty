import type { Layer } from '@deck.gl/core'
import { IconLayer, SolidPolygonLayer } from '@deck.gl/layers'
import type { Fork, Interchange } from '../market/interchange'
import { AREA_BY_ID, type Area } from '../regions/areas'
import type { Palette, Rgba } from '../shared/palette'
import { lerpRgb } from '../shared/scale'
import type { Interleaved } from './layers'
import { FULL_SIZE_ZOOM, mapScale } from './scale'

/**
 * One stroke of the flows for the slot, laid from where the power comes to where it goes: a whole line with its head,
 * or a piece of a fork, a thin tail or the one shaft that carries the fork's total.
 */
export interface FlowDatum {
  id: string
  path: [[number, number], [number, number]]
  /** The flow, MW, always positive along `path`; a tail carries none of its own. */
  mw: number
  /** How full the line is, 0 to 1, for its color; a fork, over two lines, takes the middle. */
  load: number
  head: boolean
  /** Whether each end stands on an area's column and keeps clear of it; a fork's junction stands on none. */
  clear: [boolean, boolean]
  /** A tail's fixed width, pixels at full size, in place of one from the flow. */
  px?: number
}

const point = (end: Area): [number, number] => [...AREA_BY_ID[end].anchor]

/** How far from the fork's own area toward the other two the junction sits, as a share of the way. */
const JOIN = 0.45
const TAIL_PX = 2
const FORK_LOAD = 0.5

export function flowData(x: Interchange): FlowDatum[] {
  const links = x.links.map((l): FlowDatum => ({
    id: l.id,
    path: [point(l.from), point(l.to)],
    mw: l.mw,
    load: l.load,
    head: true,
    clear: [true, true],
  }))
  return [...links, ...x.forks.flatMap(forkData)]
}

/** A fork into its area: a tail from each of the other two to a junction, then one arrow on. Out of it, the reverse. */
export function forkData(f: Fork): FlowDatum[] {
  const focus = point(f.focus)
  const [a, b] = f.others.map(point)
  const junction: [number, number] = [
    focus[0] + ((a[0] + b[0]) / 2 - focus[0]) * JOIN,
    focus[1] + ((a[1] + b[1]) / 2 - focus[1]) * JOIN,
  ]
  const tail = (end: [number, number], i: number): FlowDatum => ({
    id: `${f.id}/${i}`,
    path: f.into ? [end, junction] : [junction, end],
    mw: 0,
    load: FORK_LOAD,
    head: !f.into,
    clear: f.into ? [true, false] : [false, true],
    px: TAIL_PX,
  })
  const shaft: FlowDatum = {
    id: f.id,
    path: f.into ? [junction, focus] : [focus, junction],
    mw: f.mw,
    load: FORK_LOAD,
    head: f.into,
    clear: f.into ? [false, true] : [true, false],
  }
  return [tail(a, 0), tail(b, 1), shaft]
}

const MW_PER_PX = 1000
const MIN_PX = 1
/** Half the width and the height, in pixels with a margin, of the column a glyph draws over an anchor; the arrows keep clear of it at both ends. */
const COLUMN_HALF_PX = [12, 48]
/** The most of a line the clearances and the head may take, so the shaft keeps the rest of a short line. */
const CLEAR_SHARE = 0.6

/** The line's width on screen, a pixel plus one per gigawatt at full size, scaled with the map. */
export const widthOf = (d: FlowDatum, zoom = FULL_SIZE_ZOOM) => (d.px ?? MIN_PX + d.mw / MW_PER_PX) * mapScale(zoom)

/** The arrowhead's size on screen, growing with the shaft. */
export const headSize = (d: FlowDatum, zoom = FULL_SIZE_ZOOM) =>
  (8 + (d.px ?? MIN_PX + d.mw / MW_PER_PX) * 3) * mapScale(zoom)

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

/** Degrees of longitude per screen pixel at a zoom, on MapLibre's 512-pixel tiles. */
export const degreesPerPixel = (zoom: number) => 360 / (512 * 2 ** zoom)

/** The line in screen pixels at the zoom: its heading as a unit vector, its length, and the degrees a pixel spans each way. */
function frame([[x1, y1], [x2, y2]]: FlowDatum['path'], zoom: number) {
  const perPixel = degreesPerPixel(zoom)
  const lat = ((y1 + y2) / 2) * (Math.PI / 180)
  const dLon = perPixel
  const dLat = perPixel * Math.cos(lat)
  const px = (x2 - x1) / dLon
  const py = (y2 - y1) / dLat
  const length = Math.hypot(px, py) || 1
  return { dLon, dLat, ux: px / length, uy: py / length, length }
}

/** How far, in pixels, a line heading `ux, uy` runs from an anchor before it is out of the column drawn over it at the zoom. */
function clearance(ux: number, uy: number, zoom: number): number {
  const [halfWidth, halfHeight] = COLUMN_HALF_PX.map((px) => px * mapScale(zoom))
  return Math.min(halfWidth / Math.abs(ux || 1e-9), halfHeight / Math.abs(uy || 1e-9))
}

/**
 * Where the shaft starts and where it ends and the head begins: each end clear of the column at its anchor, the
 * head's own length clear too, in pixels so a phone's smaller map does not tuck the heads under the columns; a line
 * too short for both keeps two fifths of itself as the shaft.
 */
export function shaftEnds(d: FlowDatum, zoom: number): FlowDatum['path'] {
  const { dLon, dLat, ux, uy, length } = frame(d.path, zoom)
  const clear = clearance(ux, uy, zoom)
  let start = d.clear[0] ? clear : 0
  let end = (d.clear[1] ? clear : 0) + (d.head ? headSize(d, zoom) : 0)
  const room = length * CLEAR_SHARE
  if (start + end > room) {
    const share = room / (start + end)
    start *= share
    end *= share
  }
  const [x1, y1] = d.path[0]
  const at = (pixels: number): [number, number] => [x1 + ux * pixels * dLon, y1 + uy * pixels * dLat]
  return [at(start), at(length - end)]
}

/**
 * The shaft as one solid shape: a hair wide where the power leaves, the flow's width where the head begins, its
 * widths turned from pixels into degrees at the map's zoom, so it is rebuilt as the map zooms and never has a joint.
 */
export function taperPolygon(d: FlowDatum, zoom: number): [number, number][] {
  const [from, to] = shaftEnds(d, zoom)
  const { dLon, dLat, ux, uy } = frame(d.path, zoom)
  const normal = [-uy, ux]
  const offset = (p: [number, number], pixels: number): [number, number] => [
    p[0] + normal[0] * pixels * dLon,
    p[1] + normal[1] * pixels * dLat,
  ]
  // A tail keeps its width; a flow tapers from a hair where it leaves to its width where the head begins.
  const h1 = widthOf(d, zoom) / 2
  const h0 = d.px ? h1 : (MIN_PX * mapScale(zoom)) / 2
  return [offset(from, h0), offset(to, h1), offset(to, -h1), offset(from, -h0)]
}

/** The arrow's heading in degrees counterclockwise from east, on the map's mercator plane. */
export function heading([[x1, y1], [x2, y2]]: FlowDatum['path']): number {
  const lat = ((y1 + y2) / 2) * (Math.PI / 180)
  return (Math.atan2((y2 - y1) / Math.cos(lat), x2 - x1) * 180) / Math.PI
}

/**
 * The flows as arrows: a solid shaft tapering from a hair where the power leaves to the flow's width where the head
 * begins, colored by the load, and a head in the same color, sized with the shaft, pointing on the way the power goes.
 */
export function buildFlowLayers(
  interchange: Interchange | null,
  palette: Palette,
  zoom: number,
  beforeId = 'water_name',
): Layer[] {
  const data = interchange ? flowData(interchange) : []
  if (!interchange || !data.length) return []
  const ramp = palette.flow[interchange.source]
  const color = (d: FlowDatum): Rgba => [...lerpRgb(ramp.idle, ramp.full, d.load), 230]
  const head = (d: FlowDatum): [number, number] => shaftEnds(d, zoom)[1]
  return [
    new SolidPolygonLayer<FlowDatum, Interleaved>({
      id: 'flows',
      beforeId,
      data,
      getPolygon: (d) => taperPolygon(d, zoom),
      getFillColor: color,
      updateTriggers: { getPolygon: zoom, getFillColor: [palette, interchange.source] },
    }),
    new IconLayer<FlowDatum, Interleaved>({
      id: 'flow-heads',
      beforeId,
      data: data.filter((d) => d.head),
      iconAtlas: HEAD_ICON.head.url,
      iconMapping: HEAD_ICON,
      getIcon: () => 'head',
      getPosition: head,
      getAngle: (d) => heading(d.path),
      getColor: color,
      getSize: (d) => headSize(d, zoom),
      sizeUnits: 'pixels',
      billboard: false,
      updateTriggers: { getPosition: zoom, getSize: zoom, getColor: [palette, interchange.source] },
    }),
  ]
}
