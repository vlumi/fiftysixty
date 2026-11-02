import type { Hz } from '../regions/areas'
import type { Regions } from '../regions/geometry'

export type Segment = [[number, number], [number, number]]

/**
 * The half's outline, the coast and the split line: the edges of its areas' polygons that no second area of the
 * half shares, since the areas were dissolved and simplified together and so meet edge for edge, as the borders
 * are built from them.
 */
export function halfOutline(areas: Regions['areas'], half: Hz): Segment[] {
  const edges = new Map<string, Segment>()
  const shared = new Set<string>()
  for (const f of areas.features) {
    if (f.properties.hz !== half) continue
    const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    for (const rings of polygons)
      for (const ring of rings)
        for (let i = 1; i < ring.length; i++) {
          const [a, b] = [ring[i - 1].join(','), ring[i].join(',')]
          const key = a < b ? `${a}|${b}` : `${b}|${a}`
          if (edges.has(key)) shared.add(key)
          else edges.set(key, [ring[i - 1], ring[i]] as Segment)
        }
  }
  return [...edges].filter(([key]) => !shared.has(key)).map(([, segment]) => segment)
}
