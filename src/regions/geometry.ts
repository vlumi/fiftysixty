import type { FeatureCollection, LineString, MultiPolygon, Polygon } from 'geojson'
import type { Area, Hz } from './areas'

export interface AreaProps {
  area: Area
  hz: Hz
}

/** The ten areas as polygons and the 50/60 split as one line, both built by scripts/build-regions.mjs. */
export interface Regions {
  areas: FeatureCollection<Polygon | MultiPolygon, AreaProps>
  split: FeatureCollection<LineString, { name: string }>
}

export async function loadRegions(base = '/geo'): Promise<Regions> {
  const [areas, split] = await Promise.all([json(`${base}/areas.geojson`), json(`${base}/split.geojson`)])
  return { areas, split }
}

async function json(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return response.json()
}
