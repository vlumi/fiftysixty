import type { Layer } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'
import type { Feature, Point } from 'geojson'
import type { Series } from '../market/stack'
import type { PlantProps, Plants } from '../regions/plants'
import type { Palette, Rgba } from '../shared/palette'
import type { Interleaved } from './layers'

/** The zoom from which the plants show; further out they would only crowd the columns. */
export const PLANTS_FROM_ZOOM = 6

type PlantFeature = Feature<Point, PlantProps>

/** A dot's radius on screen: a few pixels plus the square root of the capacity, so area follows capacity. */
export const plantRadius = (mw: number) => 3 + Math.sqrt(mw) / 4

/** The plants as dots colored by fuel and sized by capacity, drawn once the map is close enough. */
export function buildPlantLayers(
  plants: Plants | null,
  palette: Palette,
  zoom: number,
  selected: string | null,
  hiddenFuels: readonly Series[] = [],
  beforeId = 'water_name',
): Layer[] {
  if (!plants || zoom < PLANTS_FROM_ZOOM) return []
  return [
    new ScatterplotLayer<PlantFeature, Interleaved>({
      id: 'plants',
      beforeId,
      data: plants.features.filter((f) => !hiddenFuels.includes(f.properties.fuel)),
      getPosition: (f) => f.geometry.coordinates as [number, number],
      getRadius: (f) => plantRadius(f.properties.mw),
      radiusUnits: 'pixels',
      getFillColor: (f): Rgba => [...palette.series[f.properties.fuel], 220],
      stroked: true,
      getLineColor: (f): Rgba => (f.properties.id === selected ? [...palette.text, 255] : [...palette.bg, 200]),
      getLineWidth: (f) => (f.properties.id === selected ? 2 : 1),
      lineWidthUnits: 'pixels',
      pickable: true,
      updateTriggers: { getFillColor: palette, getLineColor: [palette, selected], getLineWidth: selected },
    }),
  ]
}
