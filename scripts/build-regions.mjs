#!/usr/bin/env node
// Dissolves the prefecture polygons into the supply areas and derives the 50/60 split line and the border
// between each pair of areas an interconnector joins, writing all three to public/geo/ for the browser to
// fetch. Run when the area table or the source changes:
//
//   npm run regions
//
// mapshaper does the geometry; it is not a dependency of the project, since its native addons are
// of no use on the host, but is fetched by npx for this script alone, which drives its command line.
// Source: dataofjapan/land, from GSI's 地球地図日本 (Global Map Japan), which requires attribution.
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { AREAS } from '../src/regions/areas.ts'
import { INTERCONNECTORS } from '../src/regions/interconnectors.ts'

const SOURCE = 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'geo')

const byPrefecture = Object.fromEntries(AREAS.flatMap((a) => a.prefectures.map((p) => [p, a.id])))
const hzByArea = Object.fromEntries(AREAS.map((a) => [a.id, a.hz]))

/** How far out to sea, in degrees of latitude, a border between two shores is followed before the water is open sea. */
const SEA_REACH = 0.3
/** The grid the sea borders are traced on, in degrees. */
const SEA_STEP = 0.02

/** The rings of an area's polygons, each as its list of points. */
function ringsOf(feature) {
  const { type, coordinates } = feature.geometry
  return (type === 'Polygon' ? [coordinates] : coordinates).flat()
}

/** The area's boundary as edges keyed by their two ends in a fixed order, so a neighbor's matching edge keys the same. */
function edgesOf(rings) {
  const edges = new Map()
  for (const ring of rings)
    for (let i = 1; i < ring.length; i++) {
      const [a, b] = [ring[i - 1], ring[i]].map((p) => p.join(','))
      edges.set(a < b ? `${a}|${b}` : `${b}|${a}`, [ring[i - 1], ring[i]])
    }
  return edges
}

/** The edges chained end to end into as few lines as they make. */
function chain(edges) {
  const byEnd = new Map()
  for (const edge of edges)
    for (const end of edge) {
      const key = end.join(',')
      if (!byEnd.has(key)) byEnd.set(key, [])
      byEnd.get(key).push(edge)
    }
  const used = new Set()
  const lines = []
  for (const start of edges) {
    if (used.has(start)) continue
    used.add(start)
    const line = [...start]
    for (const forward of [true, false]) {
      for (;;) {
        const tip = forward ? line[line.length - 1] : line[0]
        const next = byEnd.get(tip.join(',')).find((e) => !used.has(e))
        if (!next) break
        used.add(next)
        const other = next[0].join(',') === tip.join(',') ? next[1] : next[0]
        if (forward) line.push(other)
        else line.unshift(other)
      }
    }
    lines.push(line)
  }
  return lines
}

/** The polygon's edges as segments, for distances. */
function segmentsOf(rings) {
  return rings.flatMap((ring) => ring.slice(1).map((p, i) => [ring[i], p]))
}

/** A point's distance to the nearest of the segments, in degrees with the longitude scaled to the latitude. */
function distanceTo(segments, x, y, kx) {
  let best = Infinity
  for (const [[ax, ay], [bx, by]] of segments) {
    const px = (bx - ax) * kx
    const py = by - ay
    const dx = (x - ax) * kx
    const dy = y - ay
    const t = Math.max(0, Math.min(1, (dx * px + dy * py) / (px * px + py * py || 1)))
    const d = Math.hypot(dx - px * t, dy - py * t)
    if (d < best) best = d
  }
  return best
}

const bboxOf = (rings) => {
  const box = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [x, y] of rings.flat()) {
    box[0] = Math.min(box[0], x)
    box[1] = Math.min(box[1], y)
    box[2] = Math.max(box[2], x)
    box[3] = Math.max(box[3], y)
  }
  return box
}

/**
 * The border between two shores across water: the line equidistant from the two areas' coasts, traced on a grid over
 * the water between them and clipped where the sea opens beyond SEA_REACH or a third area is nearer than either.
 */
function seaBorder(areas, a, b) {
  const rings = Object.fromEntries(areas.features.map((f) => [f.properties.area, ringsOf(f)]))
  const [boxA, boxB] = [bboxOf(rings[a]), bboxOf(rings[b])]
  const box = [
    Math.max(boxA[0], boxB[0]) - SEA_REACH,
    Math.max(boxA[1], boxB[1]) - SEA_REACH,
    Math.min(boxA[2], boxB[2]) + SEA_REACH,
    Math.min(boxA[3], boxB[3]) + SEA_REACH,
  ]
  const kx = Math.cos((((box[1] + box[3]) / 2) * Math.PI) / 180)
  const near = (area) => {
    const o = bboxOf(rings[area])
    return o[0] < box[2] && o[2] > box[0] && o[1] < box[3] && o[3] > box[1]
  }
  const segs = { a: segmentsOf(rings[a]), b: segmentsOf(rings[b]) }
  const others = Object.keys(rings)
    .filter((area) => area !== a && area !== b && near(area))
    .map((area) => segmentsOf(rings[area]))
  const columns = Math.ceil((box[2] - box[0]) / SEA_STEP) + 1
  const rows = Math.ceil((box[3] - box[1]) / SEA_STEP) + 1
  const nodes = []
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < columns; i++) {
      const x = box[0] + i * SEA_STEP
      const y = box[1] + j * SEA_STEP
      const dA = distanceTo(segs.a, x, y, kx)
      const dB = distanceTo(segs.b, x, y, kx)
      const nearer = Math.min(dA, dB)
      const other = Math.min(...others.map((o) => distanceTo(o, x, y, kx)))
      nodes.push({ x, y, f: dA - dB, ok: nearer <= SEA_REACH && other > nearer })
    }
  const at = (i, j) => nodes[j * columns + i]
  const cross = (p, q) => {
    const t = p.f / (p.f - q.f)
    return [p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t]
  }
  const segments = []
  for (let j = 0; j < rows - 1; j++)
    for (let i = 0; i < columns - 1; i++) {
      const corners = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]
      if (corners.some((c) => !c.ok)) continue
      const points = []
      for (let k = 0; k < 4; k++) {
        const [p, q] = [corners[k], corners[(k + 1) % 4]]
        if (p.f < 0 !== q.f < 0) points.push(k < 2 ? cross(p, q) : cross(q, p))
      }
      for (let k = 0; k + 1 < points.length; k += 2) segments.push([points[k], points[k + 1]])
    }
  const round = (p) => p.map((v) => Number(v.toFixed(4)))
  return chain(segments)
    .filter((line) => line.length > 3)
    .map((line) => line.map(round))
}

/**
 * For each interconnector, the border between its two areas: the edges the dissolved polygons share, chained into
 * lines, or the line traced down the middle of the water where they share none.
 */
function bordersOf(areas) {
  const edgesByArea = Object.fromEntries(areas.features.map((f) => [f.properties.area, edgesOf(ringsOf(f))]))
  const features = INTERCONNECTORS.map(({ id, ends: [a, b] }) => {
    const shared = [...edgesByArea[a]].filter(([key]) => edgesByArea[b].has(key)).map(([, edge]) => edge)
    const lines = shared.length ? chain(shared) : seaBorder(areas, a, b)
    if (!lines.length) throw new Error(`No border for ${id}`)
    return {
      type: 'Feature',
      geometry: { type: 'MultiLineString', coordinates: lines },
      properties: { line: id, a, b, sea: !shared.length },
    }
  })
  return { type: 'FeatureCollection', features }
}

const response = await fetch(SOURCE)
if (!response.ok) throw new Error(`${SOURCE}: ${response.status}`)
const work = await mkdtemp(join(tmpdir(), 'fiftysixty-regions-'))
try {
  await writeFile(join(work, 'japan.geojson'), Buffer.from(await response.arrayBuffer()))
  const commands = [
    ['-i', 'japan.geojson'],
    ['-each', `area = (${JSON.stringify(byPrefecture)})[id]; hz = (${JSON.stringify(hzByArea)})[area]`],
    ['-dissolve', 'area', 'copy-fields=hz'],
    ['-filter-islands', 'min-area=20km2'],
    ['-simplify', '5%', 'keep-shapes'],
    ['-clean'],
    ['-o', 'areas.geojson', 'precision=0.0001'],
    ['-dissolve', 'hz'],
    ['-innerlines'],
    ['-each', 'name = "50/60"'],
    ['-o', 'split.geojson', 'precision=0.0001'],
  ].flat()
  await promisify(execFile)('mapshaper', commands, { cwd: work })
  await mkdir(OUT, { recursive: true })
  for (const name of ['areas.geojson', 'split.geojson']) {
    const content = await readFile(join(work, name))
    await writeFile(join(OUT, name), content)
    console.log(`${name}: ${(content.length / 1024).toFixed(0)} kB`)
  }
  const borders = JSON.stringify(bordersOf(JSON.parse(await readFile(join(work, 'areas.geojson'), 'utf8'))))
  await writeFile(join(OUT, 'borders.geojson'), borders + '\n')
  console.log(`borders.geojson: ${(borders.length / 1024).toFixed(0)} kB`)
} finally {
  await rm(work, { recursive: true, force: true })
}
