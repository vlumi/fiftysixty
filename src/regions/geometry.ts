import type { FeatureCollection, LineString, MultiLineString, MultiPolygon, Polygon } from 'geojson'
import type { Area, Hz } from './areas'

export interface AreaProps {
  area: Area
  hz: Hz
}

/** The border between the two areas an interconnector joins, by the line's id; across water it is a hand-laid path. */
export interface BorderProps {
  line: string
  a: Area
  b: Area
  sea: boolean
}

/** The ten areas as polygons, the 50/60 split as one line and the borders along the interconnectors, all built by scripts/build-regions.mjs. */
export interface Regions {
  areas: FeatureCollection<Polygon | MultiPolygon, AreaProps>
  split: FeatureCollection<LineString, { name: string }>
  borders: FeatureCollection<MultiLineString, BorderProps>
}

export async function loadRegions(base = '/geo'): Promise<Regions> {
  const [areas, split, borders] = await Promise.all(
    ['areas', 'split', 'borders'].map((name) => json(`${base}/${name}.geojson`)),
  )
  return { areas, split, borders }
}

async function json(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return response.json()
}
