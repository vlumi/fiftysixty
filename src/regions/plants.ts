import type { FeatureCollection, Point } from 'geojson'
import type { Series } from '../market/stack'
import { fetchText } from '../market/fetch'

/** A plant as OpenStreetMap maps it: its fuel on the chart's series, its capacity in MW. What it runs is not public. */
export interface PlantProps {
  id: string
  name: string
  fuel: Series
  mw: number
}

export type Plants = FeatureCollection<Point, PlantProps>

export async function loadPlants(base = '/geo'): Promise<Plants | null> {
  const text = await fetchText(`${base}/plants.geojson`)
  return text === null ? null : (JSON.parse(text) as Plants)
}
